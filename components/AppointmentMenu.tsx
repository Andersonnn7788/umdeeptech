import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  MoreVertical, 
  Trash2
} from "lucide-react"
import { useDeleteAppointment } from '@/lib/hooks/useAppointments'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'

interface AppointmentMenuProps {
  appointment: {
    id: string
    appointment_date: string
    appointment_time: string
    calendar_event_id?: string
    doctor: {
      name: string
      specialty: string
      location?: string
    }
  }
  onDeleted: () => void
}

export default function AppointmentMenu({ appointment, onDeleted }: AppointmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const { deleteAppointment, loading: deleting } = useDeleteAppointment()
  const { deleteCalendarEvent } = useGoogleCalendar()

  const handleDelete = async () => {
    try {
      console.log('Deleting appointment:', appointment.id)
      
      // Delete from database
      const result = await deleteAppointment(appointment.id)
      
      if (result.success) {
        // Try to delete from Google Calendar if event ID exists
        if (result.data?.appointment?.calendar_event_id) {
          try {
            await deleteCalendarEvent(result.data.appointment.calendar_event_id)
            console.log('✅ Deleted from Google Calendar')
          } catch (calendarError) {
            console.warn('⚠️ Could not delete from Google Calendar:', calendarError)
          }
        }
        
        // Notify parent component
        onDeleted()
        setShowConfirmDelete(false)
        setIsOpen(false)
        
        // Show success message
        alert('Appointment deleted successfully!')
      } else {
        alert(`Error deleting appointment: ${result.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete appointment. Please try again.')
    }
  }

  // Close dropdown when clicking outside
  const handleBackdropClick = () => {
    setIsOpen(false)
    setShowConfirmDelete(false)
  }

  return (
    <div className="relative">
      {/* Menu Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 rounded-full hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="h-5 w-5" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2">
          
          {/* Delete */}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3"
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Appointment'}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Delete Appointment</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this appointment with {appointment.doctor.name} on{' '}
              {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              This action cannot be undone and will remove the appointment from both the system and your Google Calendar.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}