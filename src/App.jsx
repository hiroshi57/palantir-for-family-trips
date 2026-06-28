import { useState, useEffect } from 'react'
import { useTrips } from './hooks/useTrips'
import Home from './pages/Home'
import NewTrip from './pages/NewTrip'
import TripDetail from './pages/TripDetail'
import AiSuggest from './pages/AiSuggest'
import { checkPurchaseReturn, canUse, showPaywall, recordUse } from './zenPaywall'

export default function App() {
  const {
    trips,
    addTrip, updateTrip, deleteTrip,
    addDay, updateDay, deleteDay,
    addPhoto, deletePhoto,
  } = useTrips()

  const [page, setPage] = useState({ name: 'home' })

  useEffect(() => { checkPurchaseReturn() }, [])

  function goHome() { setPage({ name: 'home' }) }
  function handleNewTrip() {
    if (!canUse()) { showPaywall(); return }
    setPage({ name: 'new' })
  }
  function handleOpenTrip(id) { setPage({ name: 'detail', tripId: id }) }
  function handleOpenAi() { setPage({ name: 'ai' }) }

  function handleSaveNewTrip(data) {
    if (!canUse()) { showPaywall(); return }
    const trip = addTrip(data)
    recordUse()
    setPage({ name: 'detail', tripId: trip.id })
  }

  function handleDeleteTrip(id) {
    deleteTrip(id)
    goHome()
  }

  function handleSaveTrips(newTrips) {
    newTrips.forEach(trip => addTrip(trip))
  }

  function handleCaptionChange(tripId, dayId, photoId, caption) {
    const trip = trips.find(t => t.id === tripId)
    if (!trip) return
    const day = trip.days.find(d => d.id === dayId)
    if (!day) return
    const photos = day.photos.map(p => p.id === photoId ? { ...p, caption } : p)
    updateDay(tripId, dayId, { photos })
  }

  if (page.name === 'new') {
    return (
      <div className="min-h-screen bg-bg">
        <NewTrip onBack={goHome} onSave={handleSaveNewTrip} />
      </div>
    )
  }

  if (page.name === 'detail') {
    const trip = trips.find(t => t.id === page.tripId)
    if (!trip) return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted">
        旅行が見つかりません
      </div>
    )
    return (
      <div className="min-h-screen bg-bg">
        <TripDetail
          trip={trip}
          onBack={goHome}
          onUpdate={patch => updateTrip(trip.id, patch)}
          onDelete={() => handleDeleteTrip(trip.id)}
          onAddDay={data => addDay(trip.id, data)}
          onUpdateDay={(dayId, patch) => updateDay(trip.id, dayId, patch)}
          onDeleteDay={dayId => deleteDay(trip.id, dayId)}
          onAddPhoto={(dayId, photo) => addPhoto(trip.id, dayId, photo)}
          onDeletePhoto={(dayId, photoId) => deletePhoto(trip.id, dayId, photoId)}
          onCaptionChange={(dayId, photoId, caption) => handleCaptionChange(trip.id, dayId, photoId, caption)}
        />
      </div>
    )
  }

  if (page.name === 'ai') {
    return (
      <div className="min-h-screen bg-bg">
        <AiSuggest trips={trips} onBack={goHome} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <Home
        trips={trips}
        onNewTrip={handleNewTrip}
        onOpenTrip={handleOpenTrip}
        onOpenAi={handleOpenAi}
        onSaveTrips={handleSaveTrips}
      />
    </div>
  )
}
