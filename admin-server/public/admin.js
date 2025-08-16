// Global state
let currentGuests = []
let currentGroups = []
let currentEditingGuest = null
let currentEditingGroup = null
let selectedGuestsForGrouping = []

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs()
    initializeEventListeners()
    loadDashboardData()
    loadGuests()
    loadGroups()
})

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn')
    const tabContents = document.querySelectorAll('.tab-content')
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'))
            tabContents.forEach(content => content.classList.remove('active'))
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active')
            document.getElementById(targetTab).classList.add('active')
            
            // Load data when switching tabs
            if (targetTab === 'dashboard') {
                loadDashboardData()
            }
        })
    })
}

// Event listeners
function initializeEventListeners() {
    // Guest search
    const guestSearch = document.getElementById('guest-search')
    if (guestSearch) {
        guestSearch.addEventListener('input', function(e) {
            const query = e.target.value
            if (query.length > 2) {
                searchGuests(query)
            } else if (query.length === 0) {
                loadGuests()
            }
        })
    }
    
    // CSV file upload
    const csvInput = document.getElementById('csv-file-input')
    const uploadArea = document.getElementById('upload-area')
    
    if (csvInput) csvInput.addEventListener('change', handleDirectImport)
    
    // Drag and drop for CSV upload
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault()
            uploadArea.classList.add('drag-over')
        })
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over')
        })
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault()
            uploadArea.classList.remove('drag-over')
            
            const files = e.dataTransfer.files
            if (files.length > 0) {
                csvInput.files = files
                handleDirectImport({ target: csvInput })
            }
        })
    }
    
    // Form submissions
    const quickGroupForm = document.getElementById('quick-group-form')
    if (quickGroupForm) quickGroupForm.addEventListener('submit', handleQuickGroupSubmit)
}

// API functions
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        })
        
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Request failed')
        }
        
        return await response.json()
    } catch (error) {
        console.error('API request failed:', error)
        throw error
    }
}

// Direct CSV Import (New Simple System)
async function handleDirectImport(event) {
    const file = event.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('csvFile', file)
    
    const progressDiv = document.getElementById('import-progress')
    const resultsDiv = document.getElementById('import-results')
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')
    
    try {
        // Show progress
        progressDiv.style.display = 'block'
        resultsDiv.style.display = 'none'
        progressText.textContent = 'Starting import...'
        
        // Use the upload endpoint that forwards to the import route
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        })
        
        progressFill.style.width = '100%'
        progressText.textContent = 'Processing results...'
        
        const result = await response.json()
        
        // Hide progress, show results
        progressDiv.style.display = 'none'
        resultsDiv.style.display = 'block'
        
        if (result.success) {
            displayImportResults(result.data)
            showToast(`✅ Import complete: ${result.data.imported} guests imported, ${result.data.duplicates} duplicates skipped`)
            
            // Refresh dashboard and guests
            loadDashboardData()
            loadGuests()
        } else {
            throw new Error(result.message)
        }
        
    } catch (error) {
        progressDiv.style.display = 'none'
        resultsDiv.style.display = 'block'
        document.getElementById('import-data').innerHTML = `
            <div class="error">
                <h4>❌ Import Failed</h4>
                <p>${error.message}</p>
            </div>
        `
        showToast(`❌ Import failed: ${error.message}`, 'error')
    }
}

function displayImportResults(results) {
    const importData = document.getElementById('import-data')
    
    const sourceBreakdown = Object.entries(results.sourceBreakdown || {})
        .map(([source, count]) => `<li><strong>${source}</strong>: ${count} guests</li>`)
        .join('')
    
    importData.innerHTML = `
        <div class="import-summary">
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-number">${results.totalRows || 0}</span>
                    <span class="stat-label">Total Rows</span>
                </div>
                <div class="stat-item success">
                    <span class="stat-number">${results.imported || 0}</span>
                    <span class="stat-label">Imported</span>
                </div>
                <div class="stat-item warning">
                    <span class="stat-number">${results.duplicates || 0}</span>
                    <span class="stat-label">Duplicates</span>
                </div>
                <div class="stat-item info">
                    <span class="stat-number">${results.plusOneCount || 0}</span>
                    <span class="stat-label">+1 Relationships</span>
                </div>
            </div>
            
            ${sourceBreakdown.length > 0 ? `
                <div class="source-breakdown">
                    <h4>📊 By Source:</h4>
                    <ul>${sourceBreakdown}</ul>
                </div>
            ` : ''}
            
            ${results.errors?.length > 0 ? `
                <div class="import-errors">
                    <h4>⚠️ Errors:</h4>
                    <ul>
                        ${results.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
        
        <div class="next-steps">
            <h4>🎯 Next Steps:</h4>
            <p>Your guests have been imported! Now you can create groups using the <strong>Group Management</strong> tab.</p>
            <button class="btn btn-primary" onclick="switchTab('grouping')">Go to Group Management</button>
        </div>
    `
}

// Smart Grouping Wizard System
let currentGroupSuggestion = null
let currentWizardMembers = []

async function loadGroupingWizard() {
    try {
        showToast('🔄 Loading grouping wizard...')
        
        // Load progress first
        const progressResult = await apiRequest('/api/grouping/progress')
        displayGroupingProgress(progressResult.data)
        
        // Load next suggestion
        const result = await apiRequest('/api/grouping/next-suggestion')
        
        if (result.data) {
            currentGroupSuggestion = result.data
            currentWizardMembers = [...result.data.suggestedMembers]
            displayGroupingWizard(result.data)
            showToast(`✅ Next group ready: ${result.data.autoGeneratedName}`)
        } else {
            displayCompletionMessage()
            showToast('🎉 All guests have been grouped!')
        }
    } catch (error) {
        showToast(`❌ Error loading wizard: ${error.message}`, 'error')
        console.error('Error loading grouping wizard:', error)
    }
}

function displayGroupingProgress(progress) {
    const container = document.getElementById('grouping-progress')
    if (!container) return
    
    container.innerHTML = `
        <div class="progress-summary">
            <h3>📊 Grouping Progress</h3>
            <div class="progress-stats">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.progressPercentage}%"></div>
                </div>
                <div class="progress-text">
                    ${progress.groupedGuests} of ${progress.totalGuests} guests grouped (${progress.progressPercentage}%)
                </div>
            </div>
            <div class="progress-details">
                <span class="remaining">🔄 ${progress.ungroupedMainGuests} groups remaining</span>
                ${progress.isComplete ? '<span class="complete">✅ All done!</span>' : ''}
            </div>
        </div>
    `
}

function displayGroupingWizard(suggestion) {
    const container = document.getElementById('grouping-suggestions')
    
    container.innerHTML = `
        <div class="wizard-container">
            <div class="wizard-header">
                <h3>🎯 Create New Group</h3>
                <p>Review the suggested members and customize as needed</p>
            </div>
            
            <div class="wizard-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="wizard-group-name">Group Name</label>
                        <input type="text" id="wizard-group-name" value="${suggestion.autoGeneratedName}">
                    </div>
                    <div class="form-group">
                        <label for="wizard-group-password">Password</label>
                        <input type="text" id="wizard-group-password" value="${suggestion.autoGeneratedPassword}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="wizard-group-misc">Notes (optional)</label>
                    <textarea id="wizard-group-misc" rows="2" placeholder="Any additional notes for this group..."></textarea>
                </div>
            </div>
            
            <div class="wizard-members">
                <h4>👥 Group Members (${suggestion.stats.totalMembers})</h4>
                <div class="member-stats">
                    <span class="stat-item">${suggestion.stats.mainGuests} main guests</span>
                    <span class="stat-item">${suggestion.stats.plusOnes} +1s</span>
                </div>
                <div id="wizard-member-list" class="member-list">
                    ${renderMemberList(currentWizardMembers, suggestion.mainGuest.id)}
                </div>
            </div>
            
            <div class="wizard-search">
                <h4>🔍 Add More Guests</h4>
                <div class="search-row">
                    <input type="text" id="wizard-search-input" placeholder="Search guests to add...">
                    <button class="btn btn-secondary" onclick="searchGuestsForWizard()">Search</button>
                </div>
                <div id="wizard-search-results" class="search-results"></div>
            </div>
            
            <div class="wizard-actions">
                <button class="btn btn-success btn-lg" onclick="createWizardGroup()">
                    ✅ Create Group (${suggestion.stats.totalMembers} guests)
                </button>
                <button class="btn btn-warning" onclick="skipCurrentGuest()">
                    ⏭️ Skip This Guest
                </button>
                <button class="btn btn-secondary" onclick="refreshWizard()">
                    🔄 Refresh
                </button>
            </div>
        </div>
    `
}

function renderMemberList(members, mainGuestId) {
    return members.map(member => `
        <div class="member-card" data-guest-id="${member.id}">
            <div class="member-info">
                <span class="member-name">
                    ${member.first_name} ${member.last_name}
                    ${member.id === mainGuestId ? '<span class="main-badge">Main</span>' : ''}
                    ${member.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
                </span>
                <span class="member-source">${member.source}</span>
            </div>
            <div class="member-actions">
                ${member.plus_one_of || member.id === mainGuestId ? 
                    `<button class="btn btn-sm btn-danger" onclick="removeMemberFromWizard('${member.id}')">Remove</button>` :
                    `<button class="btn btn-sm btn-danger" onclick="removeMemberFromWizard('${member.id}')">Remove</button>`
                }
            </div>
        </div>
    `).join('')
}

function displayCompletionMessage() {
    const container = document.getElementById('grouping-suggestions')
    container.innerHTML = `
        <div class="completion-message">
            <h2>🎉 Grouping Complete!</h2>
            <p>All guests have been assigned to groups.</p>
            <div class="completion-actions">
                <button class="btn btn-primary" onclick="switchTab('groups')">View All Groups</button>
                <button class="btn btn-secondary" onclick="switchTab('dashboard')">Go to Dashboard</button>
            </div>
        </div>
    `
}

// Wizard Action Functions
async function createWizardGroup() {
    try {
        const name = document.getElementById('wizard-group-name').value
        const password = document.getElementById('wizard-group-password').value
        const misc = document.getElementById('wizard-group-misc').value
        
        if (!name || !password) {
            showToast('⚠️ Please provide group name and password', 'warning')
            return
        }
        
        const guestIds = currentWizardMembers.map(m => m.id)
        
        showToast('🔄 Creating group...')
        
        const result = await apiRequest('/api/grouping/wizard-create-group', {
            method: 'POST',
            body: JSON.stringify({ name, password, guestIds, misc })
        })
        
        showToast(`✅ Group "${name}" created with ${guestIds.length} guests`)
        
        // Load next suggestion or show completion
        if (result.data.nextSuggestion) {
            currentGroupSuggestion = result.data.nextSuggestion
            currentWizardMembers = [...result.data.nextSuggestion.suggestedMembers]
            displayGroupingWizard(result.data.nextSuggestion)
            
            // Update progress
            const progressResult = await apiRequest('/api/grouping/progress')
            displayGroupingProgress(progressResult.data)
        } else {
            displayCompletionMessage()
        }
        
        // Refresh dashboard data
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error creating group: ${error.message}`, 'error')
        console.error('Error creating wizard group:', error)
    }
}

async function searchGuestsForWizard() {
    try {
        const query = document.getElementById('wizard-search-input').value
        if (!query || query.trim().length < 2) {
            showToast('⚠️ Please enter at least 2 characters to search', 'warning')
            return
        }
        
        const result = await apiRequest(`/api/grouping/search-guests/${encodeURIComponent(query.trim())}`)
        
        const resultsContainer = document.getElementById('wizard-search-results')
        
        if (result.data.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No ungrouped guests found matching your search.</p>'
            return
        }
        
        resultsContainer.innerHTML = `
            <div class="search-results-list">
                ${result.data.map(guest => `
                    <div class="search-result-item">
                        <div class="guest-info">
                            <span class="guest-name">${guest.first_name} ${guest.last_name}</span>
                            <span class="guest-source">${guest.source}</span>
                            ${guest.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
                        </div>
                        <button class="btn btn-sm btn-success" onclick="addGuestToWizard('${guest.id}', '${guest.first_name}', '${guest.last_name}', '${guest.source}', ${guest.plus_one_of ? `'${guest.plus_one_of}'` : 'null'})">
                            Add to Group
                        </button>
                    </div>
                `).join('')}
            </div>
        `
    } catch (error) {
        showToast(`❌ Error searching guests: ${error.message}`, 'error')
        console.error('Error searching guests for wizard:', error)
    }
}

function addGuestToWizard(id, firstName, lastName, source, plusOneOf) {
    // Check if already in group
    if (currentWizardMembers.find(m => m.id === id)) {
        showToast('⚠️ Guest is already in this group', 'warning')
        return
    }
    
    // Add to current members
    const newMember = {
        id,
        first_name: firstName,
        last_name: lastName,
        source,
        plus_one_of: plusOneOf === 'null' ? null : plusOneOf
    }
    
    currentWizardMembers.push(newMember)
    
    // Update the member list display
    updateWizardMembersList()
    
    // Clear search
    document.getElementById('wizard-search-input').value = ''
    document.getElementById('wizard-search-results').innerHTML = ''
    
    showToast(`✅ Added ${firstName} ${lastName} to group`)
}

function removeMemberFromWizard(guestId) {
    // Don't allow removing the main guest
    if (guestId === currentGroupSuggestion.mainGuest.id) {
        showToast('⚠️ Cannot remove the main guest from the group', 'warning')
        return
    }
    
    // Remove from current members
    currentWizardMembers = currentWizardMembers.filter(m => m.id !== guestId)
    
    // Update the member list display
    updateWizardMembersList()
    
    const removedMember = currentWizardMembers.find(m => m.id === guestId)
    showToast(`🗑️ Removed guest from group`)
}

function updateWizardMembersList() {
    const memberList = document.getElementById('wizard-member-list')
    if (memberList) {
        memberList.innerHTML = renderMemberList(currentWizardMembers, currentGroupSuggestion.mainGuest.id)
        
        // Update member count in button
        const createButton = document.querySelector('.wizard-actions .btn-success')
        if (createButton) {
            createButton.textContent = `✅ Create Group (${currentWizardMembers.length} guests)`
        }
    }
}

async function skipCurrentGuest() {
    if (confirm('Are you sure you want to skip this guest? They will remain ungrouped.')) {
        showToast('⏭️ Skipping to next guest...')
        // Just load the next suggestion without creating a group
        await loadGroupingWizard()
    }
}

async function refreshWizard() {
    showToast('🔄 Refreshing wizard...')
    await loadGroupingWizard()
}

function createSuggestionCard(suggestion) {
    const guests = suggestion.guests
    const guestList = guests.map(g => `
        <div class="guest-item" data-guest-id="${g.id}">
            <span class="guest-name">${g.first_name} ${g.last_name}</span>
            ${g.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
            <span class="guest-source">${g.source}</span>
        </div>
    `).join('')
    
    return `
        <div class="suggestion-card">
            <div class="suggestion-header">
                <div class="suggestion-title">
                    <h4>${suggestion.suggestedName}</h4>
                    <span class="guest-count">${guests.length} guest${guests.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="suggestion-actions">
                    <button class="btn btn-sm btn-success" onclick="createGroupFromSuggestion('${suggestion.id}')">
                        ✅ Create Group
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="customizeGrouping('${suggestion.id}')">
                        ⚙️ Customize
                    </button>
                </div>
            </div>
            
            <div class="suggestion-details">
                <p class="reason">${suggestion.reason}</p>
                <div class="guest-list">
                    ${guestList}
                </div>
                <div class="group-preview">
                    <strong>Suggested password:</strong> <code>${suggestion.suggestedPassword}</code>
                </div>
            </div>
        </div>
    `
}

async function createGroupFromSuggestion(suggestionId) {
    try {
        // Find the suggestion
        const container = document.getElementById('grouping-suggestions')
        const suggestionCard = container.querySelector(`[onclick*="${suggestionId}"]`).closest('.suggestion-card')
        const suggestion = getSuggestionData(suggestionId) // You'll need to store this
        
        if (!suggestion) {
            throw new Error('Suggestion not found')
        }
        
        const guestIds = suggestion.guests.map(g => g.id)
        
        const result = await apiRequest('/api/grouping/create-group', {
            method: 'POST',
            body: JSON.stringify({
                name: suggestion.suggestedName,
                password: suggestion.suggestedPassword,
                guestIds: guestIds
            })
        })
        
        showToast(`✅ Group "${result.data.name}" created with ${guestIds.length} guests`)
        
        // Refresh data
        loadGroupingSuggestions()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error creating group: ${error.message}`, 'error')
        console.error('Error creating group from suggestion:', error)
    }
}

// Store suggestions data globally for reference
let currentSuggestions = []

function getSuggestionData(suggestionId) {
    return currentSuggestions.find(s => s.id === suggestionId)
}

// Quick group form submission
async function handleQuickGroupSubmit(event) {
    event.preventDefault()
    
    const name = document.getElementById('group-name-quick').value
    const password = document.getElementById('group-password-quick').value
    
    if (selectedGuestsForGrouping.length === 0) {
        showToast('⚠️ Please select guests for the group', 'warning')
        return
    }
    
    try {
        const result = await apiRequest('/api/grouping/create-group', {
            method: 'POST',
            body: JSON.stringify({
                name,
                password,
                guestIds: selectedGuestsForGrouping
            })
        })
        
        showToast(`✅ Group "${name}" created successfully`)
        
        // Reset form and selections
        document.getElementById('quick-group-form').reset()
        selectedGuestsForGrouping = []
        updateSelectedGuestsDisplay()
        
        // Refresh data
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error creating group: ${error.message}`, 'error')
    }
}

// Utility functions
function switchTab(tabName) {
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`)
    if (tabButton) {
        tabButton.click()
    }
}

function showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `
    
    // Set background color based on type
    const colors = {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c'
    }
    toast.style.backgroundColor = colors[type] || colors.info
    
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1'
        toast.style.transform = 'translateX(0)'
    }, 10)
    
    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transform = 'translateX(100%)'
        setTimeout(() => document.body.removeChild(toast), 300)
    }, 4000)
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const [guestsResult, groupsResult, coverageResult] = await Promise.all([
            apiRequest('/api/guests'),
            apiRequest('/api/groups'),
            apiRequest('/api/contact-coverage')
        ])
        
        // Update stats
        document.getElementById('total-guests').textContent = guestsResult.data.length
        document.getElementById('total-groups').textContent = groupsResult.data.length
        
        const ungrouped = guestsResult.data.filter(g => !g.group_id)
        document.getElementById('ungrouped-guests').textContent = ungrouped.length
        
        const groupsWithContact = coverageResult.data.filter(g => g.hasContact)
        document.getElementById('groups-with-contact').textContent = groupsWithContact.length
        
        // Update contact coverage
        displayContactCoverage(coverageResult.data)
        
    } catch (error) {
        console.error('Error loading dashboard data:', error)
        showToast('❌ Error loading dashboard data', 'error')
    }
}

// Load guests
async function loadGuests() {
    try {
        const result = await apiRequest('/api/guests')
        currentGuests = result.data
        displayGuests(currentGuests)
    } catch (error) {
        console.error('Error loading guests:', error)
        showToast('❌ Error loading guests', 'error')
    }
}

// Load groups
async function loadGroups() {
    try {
        const result = await apiRequest('/api/groups')
        currentGroups = result.data
        displayGroups(currentGroups)
    } catch (error) {
        console.error('Error loading groups:', error)
        showToast('❌ Error loading groups', 'error')
    }
}

// Display functions (simplified versions of existing functions)
function displayGuests(guests) {
    const tbody = document.querySelector('#guests-table tbody')
    if (!tbody) return
    
    tbody.innerHTML = guests.map(guest => `
        <tr>
            <td>
                ${guest.first_name} ${guest.last_name}
                ${guest.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
            </td>
            <td><small>${guest.source || 'Unknown'}</small></td>
            <td>
                ${guest.groups?.name || '<em>No group</em>'}
                ${!guest.groups?.name ? `
                    <br><button class="btn btn-xs btn-success" onclick="showAddToGroupModal('${guest.id}', '${guest.first_name}', '${guest.last_name}')" title="Add to group">
                        ➕ Add to Group
                    </button>
                ` : ''}
            </td>
            <td>
                ${guest.plus_one_of 
                    ? '<span class="relationship-tag">+1 Guest</span>' 
                    : '<span class="relationship-tag primary">Main Guest</span>'
                }
            </td>
            <td>
                <div class="guest-actions">
                    <button class="btn btn-xs btn-secondary" onclick="editGuest('${guest.id}')" title="Edit guest">
                        ✏️
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="confirmDeleteGuest('${guest.id}', '${guest.first_name}', '${guest.last_name}')" title="Delete guest">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('')
}

// Helper function to get contact summary for a group
function getGroupContactSummary(group) {
    const phones = group.guests.filter(g => g.phone && g.phone.trim() !== '')
    const emails = group.guests.filter(g => g.email && g.email.trim() !== '')
    const addresses = group.guests.filter(g => g.address && g.address.trim() !== '')
    
    if (phones.length === 0 && emails.length === 0 && addresses.length === 0) {
        return '<span class="no-contact">No contact information available</span>'
    }
    
    const contactParts = []
    
    if (phones.length > 0) {
        const phoneText = phones.length === 1 
            ? `📱 ${phones[0].phone}` 
            : `📱 ${phones.length} phone${phones.length > 1 ? 's' : ''}`
        contactParts.push(phoneText)
    }
    
    if (emails.length > 0) {
        const emailText = emails.length === 1 
            ? `📧 ${emails[0].email}` 
            : `📧 ${emails.length} email${emails.length > 1 ? 's' : ''}`
        contactParts.push(emailText)
    }
    
    if (addresses.length > 0) {
        const addressText = addresses.length === 1 
            ? `🏠 ${addresses[0].address}` 
            : `🏠 ${addresses.length} address${addresses.length > 1 ? 'es' : ''}`
        contactParts.push(addressText)
    }
    
    return contactParts.join(' • ')
}

function displayGroups(groups) {
    const container = document.getElementById('groups-container')
    if (!container) return
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="no-groups">
                <p>😌 No groups created yet. Use <strong>Group Management</strong> to create groups from your imported guests.</p>
                <button class="btn btn-primary" onclick="switchTab('grouping')">🎯 Go to Group Management</button>
            </div>
        `
        return
    }
    
    container.innerHTML = groups.map(group => `
        <div class="group-card">
            <div class="group-header">
                <div class="group-title">
                    <h3>${group.name}</h3>
                    <span class="guest-count">${group.guests.length} guest${group.guests.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="group-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editGroup('${group.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-info" onclick="editGroupContact('${group.id}', '${group.name}')">
                        📞 Contact
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="addGuestsToGroup('${group.id}')">
                        ➕ Add Guests
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteGroup('${group.id}', '${group.name}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
            <div class="group-details">
                <div class="login-info">
                    <strong>🔑 Login Password:</strong> 
                    <code class="password-display">${group.password}</code>
                </div>
                ${group.misc ? `<div class="group-misc"><strong>📝 Notes:</strong> ${group.misc}</div>` : ''}
                
                <div class="group-contact-info">
                    <strong>📞 Contact Info:</strong>
                    <div class="contact-summary">
                        ${getGroupContactSummary(group)}
                    </div>
                </div>
                
                <div class="group-guests">
                    <strong>👥 Members:</strong>
                    ${group.guests.map(g => `
                        <span class="guest-tag">
                            ${g.first_name} ${g.last_name}
                            ${g.plus_one_of ? '<small>(+1)</small>' : ''}
                            <button class="btn btn-xs btn-danger" onclick="removeGuestFromGroup('${g.id}', '${g.first_name}', '${g.last_name}', '${group.id}')" title="Remove from group">×</button>
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('')
}

function displayContactCoverage(coverage) {
    const container = document.getElementById('coverage-list')
    if (!container) return
    
    container.innerHTML = coverage.map(group => `
        <div class="coverage-item ${group.hasContact ? 'has-contact' : 'no-contact'}">
            <div class="coverage-header">
                <span class="group-name">${group.groupName}</span>
                <span class="contact-status">
                    ${group.hasContact ? '✅' : '❌'}
                </span>
            </div>
            <div class="coverage-details">
                ${group.hasContact 
                    ? `<small>Contact available</small>`
                    : `<small>No contact information</small>`
                }
            </div>
        </div>
    `).join('')
}

// Simplified functionality for the clean interface
async function searchGuests(query) {
    try {
        const result = await apiRequest(`/api/guests/search?q=${encodeURIComponent(query)}`)
        displayGuests(result.data)
    } catch (error) {
        console.error('Error searching guests:', error)
        showToast('❌ Error searching guests', 'error')
    }
}

// Add missing functions referenced in the HTML
function showUngroupedGuests() {
    // Switch to grouping tab to see ungrouped guests
    switchTab('grouping')
    showToast('🔄 Loading ungrouped guests...', 'info')
    
    // Load ungrouped guests specifically
    loadGroupingSuggestions()
}

function customizeGrouping(suggestionId) {
    showToast('⚙️ Customize grouping feature coming soon!', 'info')
}

function updateSelectedGuestsDisplay() {
    const container = document.getElementById('selected-guests')
    if (!container) return
    
    if (selectedGuestsForGrouping.length === 0) {
        container.innerHTML = '<p class="no-selection">No guests selected</p>'
        return
    }
    
    container.innerHTML = `
        <h4>Selected Guests (${selectedGuestsForGrouping.length})</h4>
        <div class="selected-list">
            ${selectedGuestsForGrouping.map(id => {
                const guest = currentGuests.find(g => g.id === id)
                return guest ? `<span class="selected-guest">${guest.first_name} ${guest.last_name}</span>` : ''
            }).join('')}
        </div>
        <button class="btn btn-sm btn-secondary" onclick="clearSelectedGuests()">Clear Selection</button>
    `
}

function clearSelectedGuests() {
    selectedGuestsForGrouping = []
    updateSelectedGuestsDisplay()
}

// Group Management Functions

async function editGroup(groupId) {
    try {
        showToast('🔄 Loading group details...')
        const result = await apiRequest(`/api/groups/${groupId}`)
        const group = result.data
        
        const editContent = document.getElementById('group-edit-content')
        editContent.innerHTML = `
            <h2>✏️ Edit Group: ${group.name}</h2>
            <form id="group-edit-form">
                <div class="form-group">
                    <label for="edit-group-name">Group Name</label>
                    <input type="text" id="edit-group-name" value="${group.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-group-password">Password</label>
                    <input type="text" id="edit-group-password" value="${group.password}" required>
                </div>
                <div class="form-group">
                    <label for="edit-group-misc">Notes (optional)</label>
                    <textarea id="edit-group-misc" rows="3">${group.misc || ''}</textarea>
                </div>
                
                <div class="group-members-section">
                    <h3>👥 Group Members (${group.guests.length})</h3>
                    <div class="members-list">
                        ${group.guests.map(guest => `
                            <div class="member-item">
                                <span class="member-name">
                                    ${guest.first_name} ${guest.last_name}
                                    ${guest.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
                                </span>
                                <button type="button" class="btn btn-sm btn-danger" onclick="removeGuestFromGroup('${guest.id}', '${guest.first_name}', '${guest.last_name}', '${groupId}')">
                                    Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="add-members-section">
                        <h4>🔍 Add New Members</h4>
                        <div class="search-row">
                            <input type="text" id="edit-guest-search" placeholder="Search ungrouped guests...">
                            <button type="button" class="btn btn-secondary" onclick="searchGuestsForGroup()">Search</button>
                        </div>
                        <div id="edit-search-results" class="search-results"></div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeGroupEditModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Changes</button>
                </div>
            </form>
        `
        
        // Add form submission handler
        document.getElementById('group-edit-form').addEventListener('submit', (e) => {
            e.preventDefault()
            updateGroup(groupId)
        })
        
        document.getElementById('group-edit-modal').style.display = 'block'
        
    } catch (error) {
        showToast(`❌ Error loading group: ${error.message}`, 'error')
    }
}

async function updateGroup(groupId) {
    try {
        const name = document.getElementById('edit-group-name').value
        const password = document.getElementById('edit-group-password').value
        const misc = document.getElementById('edit-group-misc').value
        
        if (!name || !password) {
            showToast('⚠️ Please provide group name and password', 'warning')
            return
        }
        
        showToast('🔄 Updating group...')
        
        const result = await apiRequest(`/api/groups/${groupId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, password, misc })
        })
        
        showToast(`✅ Group "${name}" updated successfully`)
        closeGroupEditModal()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error updating group: ${error.message}`, 'error')
    }
}

async function removeGuestFromGroup(guestId, firstName, lastName, groupId) {
    if (!confirm(`Remove ${firstName} ${lastName} from this group?`)) {
        return
    }
    
    try {
        showToast('🔄 Removing guest from group...')
        
        // Get current guest data first
        const guestResult = await apiRequest(`/api/guests/${guestId}`)
        const currentGuest = guestResult.data
        
        // Update with null group_id while preserving all other data
        await apiRequest(`/api/guests/${guestId}`, {
            method: 'PUT',
            body: JSON.stringify({
                first_name: currentGuest.first_name,
                last_name: currentGuest.last_name,
                phone: currentGuest.phone,
                email: currentGuest.email,
                address: currentGuest.address,
                misc: currentGuest.misc,
                group_id: null
            })
        })
        
        showToast(`✅ ${firstName} ${lastName} removed from group`)
        
        // Refresh the edit modal if it's open
        if (document.getElementById('group-edit-modal').style.display === 'block') {
            editGroup(groupId)
        }
        
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error removing guest: ${error.message}`, 'error')
    }
}

async function confirmDeleteGroup(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? This will unassign all guests from the group.`)) {
        return
    }
    
    try {
        showToast('🔄 Deleting group...')
        
        await apiRequest(`/api/groups/${groupId}`, {
            method: 'DELETE'
        })
        
        showToast(`✅ Group "${groupName}" deleted`)
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error deleting group: ${error.message}`, 'error')
    }
}

async function addGuestsToGroup(groupId) {
    try {
        showToast('🔄 Loading assign to group...')
        const result = await apiRequest(`/api/groups/${groupId}`)
        const group = result.data
        
        const assignContent = document.getElementById('assign-group-content')
        assignContent.innerHTML = `
            <h2>➕ Add Guests to: ${group.name}</h2>
            <p>Search and select ungrouped guests to add to this group</p>
            
            <div class="search-section">
                <div class="search-row">
                    <input type="text" id="assign-guest-search" placeholder="Search ungrouped guests...">
                    <button class="btn btn-secondary" onclick="searchUngroupedGuestsForAssign()">Search</button>
                </div>
                <div id="assign-search-results" class="search-results"></div>
            </div>
            
            <div class="selected-section">
                <h3>Selected Guests to Add:</h3>
                <div id="assign-selected-guests" class="selected-guests-list">
                    <p class="no-selection">No guests selected</p>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeAssignGroupModal()">Cancel</button>
                <button class="btn btn-success" onclick="assignSelectedGuestsToGroup('${groupId}')" id="assign-submit-btn" disabled>
                    Add Selected Guests
                </button>
            </div>
        `
        
        document.getElementById('assign-group-modal').style.display = 'block'
        
    } catch (error) {
        showToast(`❌ Error loading assign modal: ${error.message}`, 'error')
    }
}

let selectedGuestsForAssign = []

async function searchUngroupedGuestsForAssign() {
    try {
        const query = document.getElementById('assign-guest-search').value
        if (!query || query.trim().length < 2) {
            showToast('⚠️ Please enter at least 2 characters to search', 'warning')
            return
        }
        
        const result = await apiRequest(`/api/grouping/search-guests/${encodeURIComponent(query.trim())}`)
        
        const resultsContainer = document.getElementById('assign-search-results')
        
        if (result.data.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No ungrouped guests found matching your search.</p>'
            return
        }
        
        resultsContainer.innerHTML = `
            <div class="search-results-list">
                ${result.data.map(guest => `
                    <div class="search-result-item">
                        <div class="guest-info">
                            <span class="guest-name">${guest.first_name} ${guest.last_name}</span>
                            <span class="guest-source">${guest.source}</span>
                            ${guest.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
                        </div>
                        <button class="btn btn-sm btn-success" onclick="selectGuestForAssign('${guest.id}', '${guest.first_name}', '${guest.last_name}', '${guest.source}', ${guest.plus_one_of ? `'${guest.plus_one_of}'` : 'null'})">
                            Select
                        </button>
                    </div>
                `).join('')}
            </div>
        `
    } catch (error) {
        showToast(`❌ Error searching guests: ${error.message}`, 'error')
    }
}

function selectGuestForAssign(id, firstName, lastName, source, plusOneOf) {
    // Check if already selected
    if (selectedGuestsForAssign.find(g => g.id === id)) {
        showToast('⚠️ Guest is already selected', 'warning')
        return
    }
    
    // Add to selected list
    selectedGuestsForAssign.push({
        id,
        first_name: firstName,
        last_name: lastName,
        source,
        plus_one_of: plusOneOf === 'null' ? null : plusOneOf
    })
    
    updateAssignSelectedGuestsDisplay()
    showToast(`✅ Added ${firstName} ${lastName} to selection`)
}

function removeGuestFromAssignSelection(guestId) {
    selectedGuestsForAssign = selectedGuestsForAssign.filter(g => g.id !== guestId)
    updateAssignSelectedGuestsDisplay()
}

function updateAssignSelectedGuestsDisplay() {
    const container = document.getElementById('assign-selected-guests')
    const submitBtn = document.getElementById('assign-submit-btn')
    
    if (selectedGuestsForAssign.length === 0) {
        container.innerHTML = '<p class="no-selection">No guests selected</p>'
        submitBtn.disabled = true
        return
    }
    
    container.innerHTML = `
        <div class="selected-guests-grid">
            ${selectedGuestsForAssign.map(guest => `
                <div class="selected-guest-item">
                    <span class="guest-name">
                        ${guest.first_name} ${guest.last_name}
                        ${guest.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
                    </span>
                    <button class="btn btn-xs btn-danger" onclick="removeGuestFromAssignSelection('${guest.id}')">×</button>
                </div>
            `).join('')}
        </div>
    `
    
    submitBtn.disabled = false
    submitBtn.textContent = `Add ${selectedGuestsForAssign.length} Guest${selectedGuestsForAssign.length !== 1 ? 's' : ''}`
}

async function assignSelectedGuestsToGroup(groupId) {
    if (selectedGuestsForAssign.length === 0) {
        showToast('⚠️ Please select guests to add', 'warning')
        return
    }
    
    try {
        showToast(`🔄 Adding ${selectedGuestsForAssign.length} guests to group...`)
        
        const guestIds = selectedGuestsForAssign.map(g => g.id)
        
        await apiRequest(`/api/groups/${groupId}/assign-guests`, {
            method: 'POST',
            body: JSON.stringify({ guestIds })
        })
        
        showToast(`✅ Added ${selectedGuestsForAssign.length} guests to group`)
        closeAssignGroupModal()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error assigning guests: ${error.message}`, 'error')
    }
}

async function searchGuestsForGroup() {
    try {
        const query = document.getElementById('edit-guest-search').value
        if (!query || query.trim().length < 2) {
            showToast('⚠️ Please enter at least 2 characters to search', 'warning')
            return
        }
        
        const result = await apiRequest(`/api/grouping/search-guests/${encodeURIComponent(query.trim())}`)
        
        const resultsContainer = document.getElementById('edit-search-results')
        
        if (result.data.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No ungrouped guests found matching your search.</p>'
            return
        }
        
        resultsContainer.innerHTML = `
            <div class="search-results-list">
                ${result.data.map(guest => `
                    <div class="search-result-item">
                        <div class="guest-info">
                            <span class="guest-name">${guest.first_name} ${guest.last_name}</span>
                            <span class="guest-source">${guest.source}</span>
                            ${guest.plus_one_of ? '<span class="plus-one-badge">+1</span>' : ''}
                        </div>
                        <button class="btn btn-sm btn-success" onclick="addGuestToGroupDirectly('${guest.id}', '${guest.first_name}', '${guest.last_name}')">
                            Add to Group
                        </button>
                    </div>
                `).join('')}
            </div>
        `
    } catch (error) {
        showToast(`❌ Error searching guests: ${error.message}`, 'error')
    }
}

async function addGuestToGroupDirectly(guestId, firstName, lastName) {
    try {
        showToast('🔄 Adding guest to group...')
        
        // Get current guest data first
        const guestResult = await apiRequest(`/api/guests/${guestId}`)
        const currentGuest = guestResult.data
        
        // Get the current group ID from the modal
        const groupName = document.querySelector('#group-edit-content h2').textContent.replace('✏️ Edit Group: ', '')
        const group = currentGroups.find(g => g.name === groupName)
        
        // Update with group_id while preserving all other data
        await apiRequest(`/api/guests/${guestId}`, {
            method: 'PUT',
            body: JSON.stringify({
                first_name: currentGuest.first_name,
                last_name: currentGuest.last_name,
                phone: currentGuest.phone,
                email: currentGuest.email,
                address: currentGuest.address,
                misc: currentGuest.misc,
                group_id: group.id
            })
        })
        
        showToast(`✅ Added ${firstName} ${lastName} to group`)
        
        // Refresh the edit modal
        editGroup(group.id)
        
    } catch (error) {
        showToast(`❌ Error adding guest: ${error.message}`, 'error')
    }
}

function closeGroupEditModal() {
    document.getElementById('group-edit-modal').style.display = 'none'
}

function closeAssignGroupModal() {
    document.getElementById('assign-group-modal').style.display = 'none'
    selectedGuestsForAssign = []
}

// Add Individual Guest to Group Functions

async function showAddToGroupModal(guestId, firstName, lastName) {
    try {
        showToast('🔄 Loading available groups...')
        
        // Load all groups
        const result = await apiRequest('/api/groups')
        const groups = result.data
        
        if (groups.length === 0) {
            showToast('⚠️ No groups available. Create a group first.', 'warning')
            return
        }
        
        const addToGroupContent = document.getElementById('add-to-group-content')
        addToGroupContent.innerHTML = `
            <h2>➕ Add Guest to Group</h2>
            <p>Select a group for <strong>${firstName} ${lastName}</strong></p>
            
            <div class="guest-info-section">
                <div class="guest-info-card">
                    <span class="guest-name">${firstName} ${lastName}</span>
                    <span class="guest-label">will be added to the selected group</span>
                </div>
            </div>
            
            <div class="group-search-section">
                <div class="form-group">
                    <label for="group-search-input">Search Groups</label>
                    <input type="text" id="group-search-input" placeholder="Search by group name..." oninput="filterAvailableGroups()">
                </div>
                
                <div id="available-groups-list" class="available-groups-list">
                    ${renderAvailableGroups(groups)}
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeAddToGroupModal()">Cancel</button>
                <button class="btn btn-success" id="assign-to-group-btn" onclick="assignGuestToSelectedGroup('${guestId}', '${firstName}', '${lastName}')" disabled>
                    Add to Group
                </button>
            </div>
        `
        
        // Store groups data for filtering
        window.availableGroups = groups
        window.selectedGroupId = null
        
        document.getElementById('add-guest-to-group-modal').style.display = 'block'
        
    } catch (error) {
        showToast(`❌ Error loading groups: ${error.message}`, 'error')
    }
}

function renderAvailableGroups(groups, filterQuery = '') {
    const filteredGroups = filterQuery 
        ? groups.filter(group => group.name.toLowerCase().includes(filterQuery.toLowerCase()))
        : groups
        
    if (filteredGroups.length === 0) {
        return '<p class="no-results">No groups found matching your search.</p>'
    }
    
    return `
        <div class="groups-grid">
            ${filteredGroups.map(group => `
                <div class="group-option" data-group-id="${group.id}" onclick="selectGroupForAssignment('${group.id}', '${group.name}')">
                    <div class="group-option-header">
                        <h4>${group.name}</h4>
                        <span class="member-count">${group.guests.length} member${group.guests.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="group-option-details">
                        <div class="password-info">
                            <strong>Password:</strong> <code>${group.password}</code>
                        </div>
                        ${group.misc ? `<div class="group-notes"><strong>Notes:</strong> ${group.misc}</div>` : ''}
                        <div class="group-members">
                            <strong>Members:</strong> 
                            ${group.guests.slice(0, 3).map(g => `${g.first_name} ${g.last_name}`).join(', ')}
                            ${group.guests.length > 3 ? ` and ${group.guests.length - 3} more...` : ''}
                        </div>
                    </div>
                    <div class="selection-indicator">
                        <span class="select-text">Click to select</span>
                        <span class="selected-text">✓ Selected</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `
}

function filterAvailableGroups() {
    const query = document.getElementById('group-search-input').value
    const availableGroupsList = document.getElementById('available-groups-list')
    
    if (window.availableGroups) {
        availableGroupsList.innerHTML = renderAvailableGroups(window.availableGroups, query)
    }
}

function selectGroupForAssignment(groupId, groupName) {
    // Remove previous selection
    document.querySelectorAll('.group-option.selected').forEach(option => {
        option.classList.remove('selected')
    })
    
    // Add selection to clicked group
    const selectedOption = document.querySelector(`[data-group-id="${groupId}"]`)
    if (selectedOption) {
        selectedOption.classList.add('selected')
    }
    
    // Store selected group
    window.selectedGroupId = groupId
    window.selectedGroupName = groupName
    
    // Enable the assign button
    const assignBtn = document.getElementById('assign-to-group-btn')
    assignBtn.disabled = false
    assignBtn.textContent = `Add to "${groupName}"`
    
    showToast(`✅ Selected group: ${groupName}`)
}

async function assignGuestToSelectedGroup(guestId, firstName, lastName) {
    if (!window.selectedGroupId) {
        showToast('⚠️ Please select a group first', 'warning')
        return
    }
    
    try {
        showToast(`🔄 Adding ${firstName} ${lastName} to ${window.selectedGroupName}...`)
        
        // Get current guest data first
        const guestResult = await apiRequest(`/api/guests/${guestId}`)
        const currentGuest = guestResult.data
        
        // Update with group_id while preserving all other data
        await apiRequest(`/api/guests/${guestId}`, {
            method: 'PUT',
            body: JSON.stringify({
                first_name: currentGuest.first_name,
                last_name: currentGuest.last_name,
                phone: currentGuest.phone,
                email: currentGuest.email,
                address: currentGuest.address,
                misc: currentGuest.misc,
                group_id: window.selectedGroupId
            })
        })
        
        showToast(`✅ ${firstName} ${lastName} added to "${window.selectedGroupName}"`)
        closeAddToGroupModal()
        
        // Refresh data
        loadGuests()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error adding guest to group: ${error.message}`, 'error')
    }
}

function closeAddToGroupModal() {
    document.getElementById('add-guest-to-group-modal').style.display = 'none'
    window.selectedGroupId = null
    window.selectedGroupName = null
    window.availableGroups = null
}

// Guest CRUD Functions

async function showCreateGuestModal() {
    try {
        showToast('🔄 Loading create guest form...')
        
        // Load all groups for selection
        const groupsResult = await apiRequest('/api/groups')
        const groups = groupsResult.data
        
        const guestEditContent = document.getElementById('guest-edit-content')
        guestEditContent.innerHTML = `
            <h2>➕ Create New Guest</h2>
            <form id="guest-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="guest-first-name">First Name *</label>
                        <input type="text" id="guest-first-name" required>
                    </div>
                    <div class="form-group">
                        <label for="guest-last-name">Last Name *</label>
                        <input type="text" id="guest-last-name" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="guest-phone">Phone</label>
                        <input type="tel" id="guest-phone">
                    </div>
                    <div class="form-group">
                        <label for="guest-email">Email</label>
                        <input type="email" id="guest-email">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="guest-address">Address</label>
                    <textarea id="guest-address" rows="2"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="guest-source">Source</label>
                        <input type="text" id="guest-source" placeholder="e.g., Wedding List, Friend">
                    </div>
                    <div class="form-group">
                        <label for="guest-group">Group (optional)</label>
                        <select id="guest-group">
                            <option value="">No group</option>
                            ${groups.map(group => `
                                <option value="${group.id}">${group.name} (${group.guests.length} members)</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="guest-misc">Notes</label>
                    <textarea id="guest-misc" rows="2" placeholder="Any additional notes..."></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeGuestEditModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">Create Guest</button>
                </div>
            </form>
        `
        
        // Add form submission handler
        document.getElementById('guest-form').addEventListener('submit', (e) => {
            e.preventDefault()
            createGuest()
        })
        
        document.getElementById('guest-edit-modal').style.display = 'block'
        
    } catch (error) {
        showToast(`❌ Error loading create form: ${error.message}`, 'error')
    }
}

async function editGuest(guestId) {
    try {
        showToast('🔄 Loading guest details...')
        
        // Load guest data and all groups
        const [guestResult, groupsResult] = await Promise.all([
            apiRequest(`/api/guests/${guestId}`),
            apiRequest('/api/groups')
        ])
        
        const guest = guestResult.data
        const groups = groupsResult.data
        
        const guestEditContent = document.getElementById('guest-edit-content')
        guestEditContent.innerHTML = `
            <h2>✏️ Edit Guest: ${guest.first_name} ${guest.last_name}</h2>
            <form id="guest-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="guest-first-name">First Name *</label>
                        <input type="text" id="guest-first-name" value="${guest.first_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="guest-last-name">Last Name *</label>
                        <input type="text" id="guest-last-name" value="${guest.last_name}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="guest-phone">Phone</label>
                        <input type="tel" id="guest-phone" value="${guest.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="guest-email">Email</label>
                        <input type="email" id="guest-email" value="${guest.email || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="guest-address">Address</label>
                    <textarea id="guest-address" rows="2">${guest.address || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="guest-source">Source</label>
                        <input type="text" id="guest-source" value="${guest.source || ''}" placeholder="e.g., Wedding List, Friend">
                    </div>
                    <div class="form-group">
                        <label for="guest-group">Group</label>
                        <select id="guest-group">
                            <option value="">No group</option>
                            ${groups.map(group => `
                                <option value="${group.id}" ${guest.group_id === group.id ? 'selected' : ''}>
                                    ${group.name} (${group.guests.length} members)
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="guest-misc">Notes</label>
                    <textarea id="guest-misc" rows="2" placeholder="Any additional notes...">${guest.misc || ''}</textarea>
                </div>
                
                ${guest.plus_one_of ? `
                    <div class="relationship-info">
                        <p><strong>🔗 This guest is a +1</strong></p>
                        <p>This guest is linked as a +1 to another guest. You can edit their details but the relationship will be preserved.</p>
                    </div>
                ` : ''}
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeGuestEditModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">Update Guest</button>
                </div>
            </form>
        `
        
        // Add form submission handler
        document.getElementById('guest-form').addEventListener('submit', (e) => {
            e.preventDefault()
            updateGuest(guestId)
        })
        
        document.getElementById('guest-edit-modal').style.display = 'block'
        
    } catch (error) {
        showToast(`❌ Error loading guest: ${error.message}`, 'error')
    }
}

async function createGuest() {
    try {
        const guestData = {
            first_name: document.getElementById('guest-first-name').value.trim(),
            last_name: document.getElementById('guest-last-name').value.trim(),
            phone: document.getElementById('guest-phone').value.trim() || null,
            email: document.getElementById('guest-email').value.trim() || null,
            address: document.getElementById('guest-address').value.trim() || null,
            misc: document.getElementById('guest-misc').value.trim() || null,
            group_id: document.getElementById('guest-group').value || null
        }
        
        if (!guestData.first_name || !guestData.last_name) {
            showToast('⚠️ Please provide first name and last name', 'warning')
            return
        }
        
        showToast('🔄 Creating guest...')
        
        const result = await apiRequest('/api/guests', {
            method: 'POST',
            body: JSON.stringify(guestData)
        })
        
        showToast(`✅ Guest "${guestData.first_name} ${guestData.last_name}" created successfully`)
        closeGuestEditModal()
        
        // Refresh data
        loadGuests()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error creating guest: ${error.message}`, 'error')
    }
}

async function updateGuest(guestId) {
    try {
        const guestData = {
            first_name: document.getElementById('guest-first-name').value.trim(),
            last_name: document.getElementById('guest-last-name').value.trim(),
            phone: document.getElementById('guest-phone').value.trim() || null,
            email: document.getElementById('guest-email').value.trim() || null,
            address: document.getElementById('guest-address').value.trim() || null,
            misc: document.getElementById('guest-misc').value.trim() || null,
            group_id: document.getElementById('guest-group').value || null
        }
        
        if (!guestData.first_name || !guestData.last_name) {
            showToast('⚠️ Please provide first name and last name', 'warning')
            return
        }
        
        showToast('🔄 Updating guest...')
        
        const result = await apiRequest(`/api/guests/${guestId}`, {
            method: 'PUT',
            body: JSON.stringify(guestData)
        })
        
        showToast(`✅ Guest "${guestData.first_name} ${guestData.last_name}" updated successfully`)
        closeGuestEditModal()
        
        // Refresh data
        loadGuests()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error updating guest: ${error.message}`, 'error')
    }
}

async function confirmDeleteGuest(guestId, firstName, lastName) {
    if (!confirm(`Are you sure you want to delete guest "${firstName} ${lastName}"? This action cannot be undone.`)) {
        return
    }
    
    try {
        showToast('🔄 Deleting guest...')
        
        await apiRequest(`/api/guests/${guestId}`, {
            method: 'DELETE'
        })
        
        showToast(`✅ Guest "${firstName} ${lastName}" deleted successfully`)
        
        // Refresh data
        loadGuests()
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error deleting guest: ${error.message}`, 'error')
    }
}

function closeGuestEditModal() {
    document.getElementById('guest-edit-modal').style.display = 'none'
}

// Group Contact Management Functions

async function editGroupContact(groupId, groupName) {
    try {
        showToast('🔄 Loading group contact info...')
        
        const result = await apiRequest(`/api/groups/${groupId}/contact`)
        const contactInfo = result.data
        
        const contactContent = document.getElementById('group-contact-content')
        contactContent.innerHTML = `
            <h2>📞 Edit Contact: ${groupName}</h2>
            <div class="contact-info-section">
                <p class="contact-explanation">
                    Contact information will be updated for 
                    <strong>${contactInfo.principal.name}</strong> 
                    (group principal)
                </p>
                
                ${contactInfo.allContacts.phones.length > 1 || contactInfo.allContacts.emails.length > 1 || contactInfo.allContacts.addresses.length > 1 ? `
                    <div class="all-contacts-display">
                        <h4>📋 All Group Contacts:</h4>
                        ${contactInfo.allContacts.phones.length > 0 ? `
                            <div class="contact-type">
                                <strong>📱 Phones:</strong>
                                <ul>
                                    ${contactInfo.allContacts.phones.map(p => `
                                        <li>${p.name}: ${p.phone} ${p.isPrincipal ? '(Principal)' : ''}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${contactInfo.allContacts.emails.length > 0 ? `
                            <div class="contact-type">
                                <strong>📧 Emails:</strong>
                                <ul>
                                    ${contactInfo.allContacts.emails.map(e => `
                                        <li>${e.name}: ${e.email} ${e.isPrincipal ? '(Principal)' : ''}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${contactInfo.allContacts.addresses.length > 0 ? `
                            <div class="contact-type">
                                <strong>🏠 Addresses:</strong>
                                <ul>
                                    ${contactInfo.allContacts.addresses.map(a => `
                                        <li>${a.name}: ${a.address} ${a.isPrincipal ? '(Principal)' : ''}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            <form id="group-contact-form">
                <div class="form-group">
                    <label for="group-contact-phone">📱 Primary Phone</label>
                    <input type="tel" id="group-contact-phone" value="${contactInfo.principal.phone || ''}" placeholder="Enter phone number">
                </div>
                <div class="form-group">
                    <label for="group-contact-email">📧 Primary Email</label>
                    <input type="email" id="group-contact-email" value="${contactInfo.principal.email || ''}" placeholder="Enter email address">
                </div>
                <div class="form-group">
                    <label for="group-contact-address">🏠 Primary Address</label>
                    <textarea id="group-contact-address" rows="3" placeholder="Enter full address">${contactInfo.principal.address || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeGroupContactModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">💾 Save Contact Info</button>
                </div>
            </form>
        `
        
        // Add form submission handler
        document.getElementById('group-contact-form').addEventListener('submit', (e) => {
            e.preventDefault()
            updateGroupContactInfo(groupId, groupName, contactInfo.principal.name)
        })
        
        document.getElementById('group-contact-modal').style.display = 'block'
        
    } catch (error) {
        showToast(`❌ Error loading contact info: ${error.message}`, 'error')
    }
}

async function updateGroupContactInfo(groupId, groupName, principalName) {
    try {
        const phone = document.getElementById('group-contact-phone').value.trim()
        const email = document.getElementById('group-contact-email').value.trim()
        const address = document.getElementById('group-contact-address').value.trim()
        
        showToast('🔄 Updating contact information...')
        
        const result = await apiRequest(`/api/groups/${groupId}/contact`, {
            method: 'PUT',
            body: JSON.stringify({ 
                phone: phone || null, 
                email: email || null,
                address: address || null
            })
        })
        
        showToast(`✅ Contact updated for ${principalName}`)
        closeGroupContactModal()
        
        // Refresh groups display
        loadGroups()
        loadDashboardData()
        
    } catch (error) {
        showToast(`❌ Error updating contact: ${error.message}`, 'error')
    }
}

function closeGroupContactModal() {
    document.getElementById('group-contact-modal').style.display = 'none'
}