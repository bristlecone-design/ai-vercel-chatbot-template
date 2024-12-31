import type { Geo } from '@vercel/functions';
import { appendGeoAndTimeToContext } from '../action-utils';

export function getSystemDiscoverySuggestionInstructions(
  numOfDiscoveries = 6,
  geo: Geo = {},
) {
  const DISCOVERY_SUGGESTION_INSTRUCTIONS = `
  Task:
  Generate ${numOfDiscoveries} discovery suggestions for Experience NV based on the user’s persona, interests, and additional context. Help them uncover meaningful experiences, connections, and opportunities in Nevada.

  Guidelines:

  0. ID:
    - Use a random unique ID for each suggestion, taking into account the number of existing suggestions for the start index.

  1. Conciseness:
    - Keep suggestions brief and engaging, providing a glimpse into the experience.

  2. Engagement:
    - Create open-ended suggestions that inspire exploration and knowledge sharing.  
    - Focus on outdoor recreation, economic and workforce development, social impact, collaborations, events, and community ties.

  3. Diversity:
    - Suggest both local and statewide experiences.
    - Include a mix of city/town-specific and general suggestions if city/town context is available.
    - Cover a variety of themes aligned with the user’s interests and context.

  4. Creativity:
    - Include unique, thought-provoking, or humorous ideas to spark curiosity.

  5. Language:
    - Use the user’s preferred language if their context is non-English.

  6. Exclusions:
    - Create unique activities the user has not already been presented with (existing) or excluded.

  7. General Suggestions:
    - Include at least one broadly applicable suggestion, e.g., "Explore {activity/food/outdoor rec.} in {city/town/Nevada}."

  8. Format:
    - Title: Classifies the suggestion, e.g. "Discover Art" or "Explore Local Cuisine"
    - Action: Provide a call-to-action for the user to engage with the suggestion. (Supplements the title), e.g. "Classes in {city/town}", "Food trucks in {city/town}"
    - Suggestion: Combine the title and action for a more detailed, call-to-action suggestion, e.g. "Discover art classes in {city/town}.", "Explore local cuisine food trucks in {city/town}."

  Examples:
  - Discover Art (title) {classes/exhibits/galleries} in {city/town} (action). 
  - Explore {City/Town}'s (title) {Local cuisine/food trucks} (action).  
  - Attend {Event/Fetival} (title) in {City/Town} (action). 
  - Visit {Local Landmark/Museum} (title) With friends in {city/town} (action).
  - Volunteer (title) For a {local cause/organization} in {city/town} (action).
  - Reno Rodeo (title) Experience the wildest, richest rodeo in the West (action).
  - Road Trip (title) Explore Nevada's scenic byways and hidden gems (action).

  Considerations:
  - Highlight Uniqueness: Showcase hidden gems, traditions, culture, environmental highlights, and current events.  
  - Thematic Focus: Emphasize adventure, innovation, community building, lifelong learning, and sustainability.  
  - Relevance: Align with the user’s profession, interests, and context to inspire collaboration and social impact.  

  Keywords:
  Outdoor recreation, night skies, sports, border communities, economic development, entrepreneurship, nightlife, birding, biking, social impact, tourism, partnerships, wildlife, parks, volunteering, public infrastructure, transportation, philanthropy, photography, videography, local governance, architecture, historical places.
  `;

  return appendGeoAndTimeToContext(DISCOVERY_SUGGESTION_INSTRUCTIONS, geo);
}
