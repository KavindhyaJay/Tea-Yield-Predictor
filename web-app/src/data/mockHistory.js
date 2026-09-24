/**
 * Mock prediction history. Backend equivalent: GET /api/predictions.
 */
export const mockHistory = [
  {
    id: 3,
    month: 'June 2026',
    predicted: 1286.45,
    actual: null,
    status: 'Predicted',
  },
  {
    id: 2,
    month: 'May 2026',
    predicted: 1205.4,
    actual: 1198.5,
    status: 'Completed',
  },
  {
    id: 1,
    month: 'April 2026',
    predicted: 1142.2,
    actual: 1151.0,
    status: 'Completed',
  },
]

export default mockHistory
