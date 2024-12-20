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
    - Avoid activities the user has already completed or excluded.

  7. General Prompts:
    - Include at least one broadly applicable suggestion, e.g., "Explore {activity/food/outdoor rec.} in {city/town/Nevada}."

  Examples:
  - Discover art {classes/exhibits/galleries} in {city/town}.  
  - Explore {local cuisine/food trucks} in {city/town}.  
  - Attend a {local event/festival} in {city/town}.  
  - Visit a {local landmark/museum} in {city/town}.  
  - Volunteer for a {local cause/organization} in {city/town}.  

  Considerations:
  - Highlight Uniqueness: Showcase hidden gems, traditions, culture, environmental highlights, and current events.  
  - Thematic Focus: Emphasize adventure, innovation, community building, lifelong learning, and sustainability.  
  - Relevance: Align with the user’s profession, interests, and context to inspire collaboration and social impact.  

  Keywords:
  Outdoor recreation, night skies, sports, border communities, economic development, entrepreneurship, nightlife, birding, biking, social impact, tourism, partnerships, wildlife, parks, volunteering, public infrastructure, transportation, philanthropy, photography, videography, local governance, architecture, historical places.
  `;

  return appendGeoAndTimeToContext(DISCOVERY_SUGGESTION_INSTRUCTIONS, geo);
}
