'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Notification } from '@/lib/types';

const CATS: { k: Notification['type'] | 'all'; l: string; icon: string }[] = [
  { k: 'all',         l: 'All',          icon: '🔔' },
  { k: 'commission',  l: 'Commission',   icon: '₹'  },
  { k: 'patient',     l: 'Patients',     icon: '👤' },
  { k: 'appointment', l: 'Appointments', icon: '📅' },
  { k: 'alert',       l: 'Alerts',       icon: '⚠️' },
];

const TYPE_STYLE: Record<Notification['type'], { bg: string; color: string; icon: string }> = {
  commission:  { bg: 'bg-emerald-50', color: 'text-emerald-600', icon: '₹'  },
  patient:     { bg: 'bg-blue-50',    color: 'text-blue-600',    icon: '👤' },
  appointment: { bg: 'bg-purple-50',  color: 'text-purple-600',  icon: '📅' },
  alert:       { bg: 'bg-amber-50',   color: 'text-amber-600',   icon: '⚠️' },
};

export default function NotificationsPage() {
  const { myNotifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const [filter, setFilter] = useState<Notification['type'] | 'all'>('all');

  const filtered = filter === 'all' ? myNotifications : myNotifications.filter(n => n.type === filter);
  const unread   = myNotifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-gray-900">All Notifications</div>
            {unread > 0 && <div className="text-sm text-gray-500 mt-0.5">{unread} unread notification{unread !== 1 ? 's' : ''}</div>}
          </div>
          {unread > 0 && (
            <button onClick={markAllNotificationsRead} className="text-sm font-medium text-blue-600 hover:text-blue-700">Mark all as read</button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c => (
            <button key={c.k} onClick={() => setFilter(c.k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === c.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              <span>{c.icon}</span> {c.l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔔</div>
            <div className="font-medium">No notifications in this category</div>
          </div>
        ) : filtered.map(n => {
          const style = TYPE_STYLE[n.type];
          return (
            <div key={n.id} onClick={() => markNotificationRead(n.id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${n.read ? 'border-gray-100' : 'border-blue-100 bg-blue-50/30'}`}>
              <div className="flex gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative ${style.bg} ${style.color}`}>
                  {style.icon}
                  {!n.read && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold ${n.read ? 'text-gray-800' : 'text-gray-900'}`}>{n.title}</div>
                    <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{n.time}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.body}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
