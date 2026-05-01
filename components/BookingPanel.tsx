import type { TripBookingInfo } from '../types/itinerary'

interface BookingPanelProps {
  booking: TripBookingInfo
  onChange: (booking: TripBookingInfo) => void
}

export default function BookingPanel({ booking, onChange }: BookingPanelProps) {
  const update = (updates: Partial<TripBookingInfo>) => onChange({ ...booking, ...updates })

  return (
    <section className="booking-panel">
      <div className="panel-heading">
        <div>
          <h2>旅行資訊</h2>
          <p>集中保存訂房、航班、票券與重要文件。</p>
        </div>
      </div>
      <div className="booking-grid">
        <label>
          <span>住宿名稱</span>
          <input value={booking.accommodation || ''} onChange={(e) => update({ accommodation: e.target.value })} placeholder="飯店 / 民宿" />
        </label>
        <label>
          <span>住宿地址</span>
          <input value={booking.accommodationAddress || ''} onChange={(e) => update({ accommodationAddress: e.target.value })} placeholder="入住地點" />
        </label>
        <label>
          <span>訂房編號</span>
          <input value={booking.accommodationCode || ''} onChange={(e) => update({ accommodationCode: e.target.value })} placeholder="Booking / Agoda / 官網編號" />
        </label>
        <label>
          <span>緊急聯絡</span>
          <input value={booking.emergencyContact || ''} onChange={(e) => update({ emergencyContact: e.target.value })} placeholder="姓名 / 電話 / 保險" />
        </label>
        <label className="wide">
          <span>航班資訊</span>
          <textarea value={booking.flightInfo || ''} onChange={(e) => update({ flightInfo: e.target.value })} placeholder="航班、時間、機場、行李資訊" rows={2} />
        </label>
        <label className="wide">
          <span>票券與預約</span>
          <textarea value={booking.ticketInfo || ''} onChange={(e) => update({ ticketInfo: e.target.value })} placeholder="門票、餐廳、活動預約編號" rows={2} />
        </label>
        <label className="wide">
          <span>重要文件備註</span>
          <textarea value={booking.documentNotes || ''} onChange={(e) => update({ documentNotes: e.target.value })} placeholder="護照、簽證、保險、租車、網卡等提醒" rows={2} />
        </label>
      </div>
    </section>
  )
}
