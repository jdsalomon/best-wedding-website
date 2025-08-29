export interface FAQPrompt {
  id: string
  titleKey: string
  messageKey: string
  category: 'program' | 'travel' | 'hotels' | 'rsvp' | 'weddingList' | 'general'
}

export const faqPrompts: FAQPrompt[] = [
  // Program Questions
  {
    id: 'program_schedule',
    titleKey: 'faq.program.schedule.title',
    messageKey: 'faq.program.schedule.message',
    category: 'program'
  },
  {
    id: 'program_events',
    titleKey: 'faq.program.events.title', 
    messageKey: 'faq.program.events.message',
    category: 'program'
  },
  {
    id: 'program_welcome',
    titleKey: 'faq.program.welcome.title',
    messageKey: 'faq.program.welcome.message', 
    category: 'program'
  },
  {
    id: 'program_ceremony',
    titleKey: 'faq.program.ceremony.title',
    messageKey: 'faq.program.ceremony.message',
    category: 'program'
  },

  // Travel Questions
  {
    id: 'travel_getting_there',
    titleKey: 'faq.travel.gettingThere.title',
    messageKey: 'faq.travel.gettingThere.message',
    category: 'travel'
  },
  {
    id: 'travel_car_rental',
    titleKey: 'faq.travel.carRental.title',
    messageKey: 'faq.travel.carRental.message',
    category: 'travel'
  },
  {
    id: 'travel_helicopter',
    titleKey: 'faq.travel.helicopter.title',
    messageKey: 'faq.travel.helicopter.message',
    category: 'travel'
  },
  {
    id: 'travel_ferry',
    titleKey: 'faq.travel.ferry.title',
    messageKey: 'faq.travel.ferry.message',
    category: 'travel'
  },

  // Hotels Questions
  {
    id: 'hotels_where_stay',
    titleKey: 'faq.hotels.whereStay.title',
    messageKey: 'faq.hotels.whereStay.message',
    category: 'hotels'
  },
  {
    id: 'hotels_recommendations',
    titleKey: 'faq.hotels.recommendations.title',
    messageKey: 'faq.hotels.recommendations.message',
    category: 'hotels'
  },
  {
    id: 'hotels_shuttles',
    titleKey: 'faq.hotels.shuttles.title',
    messageKey: 'faq.hotels.shuttles.message',
    category: 'hotels'
  },
  {
    id: 'hotels_promo_codes',
    titleKey: 'faq.hotels.promoCodes.title',
    messageKey: 'faq.hotels.promoCodes.message',
    category: 'hotels'
  },

  // RSVP Questions
  {
    id: 'rsvp_how_to',
    titleKey: 'faq.rsvp.howTo.title',
    messageKey: 'faq.rsvp.howTo.message',
    category: 'rsvp'
  },
  {
    id: 'rsvp_change',
    titleKey: 'faq.rsvp.change.title',
    messageKey: 'faq.rsvp.change.message',
    category: 'rsvp'
  },

  // Wedding List Questions
  {
    id: 'weddingList_registry',
    titleKey: 'faq.weddingList.registry.title',
    messageKey: 'faq.weddingList.registry.message',
    category: 'weddingList'
  },
  {
    id: 'weddingList_honeymoon',
    titleKey: 'faq.weddingList.honeymoon.title',
    messageKey: 'faq.weddingList.honeymoon.message',
    category: 'weddingList'
  },

  // General Questions
  {
    id: 'general_what_pack',
    titleKey: 'faq.general.whatPack.title',
    messageKey: 'faq.general.whatPack.message',
    category: 'general'
  },
  {
    id: 'general_weather',
    titleKey: 'faq.general.weather.title',
    messageKey: 'faq.general.weather.message',
    category: 'general'
  },
  {
    id: 'general_activities',
    titleKey: 'faq.general.activities.title',
    messageKey: 'faq.general.activities.message',
    category: 'general'
  },
  {
    id: 'general_dress_code',
    titleKey: 'faq.general.dressCode.title',
    messageKey: 'faq.general.dressCode.message',
    category: 'general'
  }
]

/**
 * Get 3 random FAQ prompts for display
 */
export function getRandomFAQPrompts(): FAQPrompt[] {
  const shuffled = [...faqPrompts].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

/**
 * Get FAQ prompts by category
 */
export function getFAQPromptsByCategory(category: FAQPrompt['category']): FAQPrompt[] {
  return faqPrompts.filter(prompt => prompt.category === category)
}