import { NextPage } from 'next'
import { useState } from 'react'

const Home: NextPage = () => {
  const [apiResponse, setApiResponse] = useState<string>('')

  const testApi = async () => {
    try {
      const response = await fetch('/api/hello')
      const data = await response.json()
      setApiResponse(data.message)
    } catch (error) {
      setApiResponse('Error calling API')
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Welcome to Our Wedding Website!</h1>
      <p>Hello World - Wedding Site Coming Soon</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={testApi}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test API
        </button>
        {apiResponse && (
          <p style={{ marginTop: '1rem', color: '#0070f3' }}>
            API Response: {apiResponse}
          </p>
        )}
      </div>
    </div>
  )
}

export default Home