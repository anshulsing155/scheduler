'use client'

interface ThemePreviewProps {
  brandColor: string
  logoUrl?: string | null
  userName?: string
  eventTitle?: string
}

export function ThemePreview({ 
  brandColor, 
  logoUrl, 
  userName = 'Your Name',
  eventTitle = '30 Minute Meeting'
}: ThemePreviewProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        {/* Mock booking page header */}
        <div className="flex items-center gap-3 mb-6">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Logo</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{userName}</h3>
            <p className="text-sm text-gray-500">{eventTitle}</p>
          </div>
        </div>
        
        {/* Mock booking form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Select a time</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['9:00 AM', '10:00 AM', '11:00 AM'].map((time) => (
                <button
                  key={time}
                  style={{ 
                    backgroundColor: time === '10:00 AM' ? brandColor : 'white',
                    borderColor: time === '10:00 AM' ? brandColor : '#E5E7EB',
                    color: time === '10:00 AM' ? 'white' : '#374151'
                  }}
                  className="px-3 py-2 text-sm border-2 rounded-md font-medium transition-colors"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          <button
            style={{ backgroundColor: brandColor }}
            className="w-full px-4 py-3 text-white rounded-md font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            Confirm Booking
          </button>
          
          <button
            style={{ borderColor: brandColor, color: brandColor }}
            className="w-full px-4 py-3 border-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
