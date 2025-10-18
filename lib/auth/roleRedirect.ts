// Utility functions for role-based redirection

export interface UserRole {
  role: 'patient' | 'doctor'
}

export function getRedirectUrlForRole(role: 'patient' | 'doctor'): string {
  switch (role) {
    case 'patient':
      return '/appointments'  // Patient dashboard - view appointments
    case 'doctor':
      return '/dermatologist'  // Doctor dashboard - manage cases and appointments
    default:
      return '/'  // Default fallback
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      console.error('Failed to get user role:', response.statusText)
      return null
    }

    const result = await response.json()
    
    if (result.success && result.data?.role) {
      return { role: result.data.role }
    }

    return null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}