import { useGetNotificationsQuery, useMarkAsReadMutation } from "./notificationApiSlice";

const NotificationsPanel = () => {
  const { data: notifications, isLoading } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();

  if (isLoading) return <p>Loading notifications...</p>;

  return (
    <div className="notifications-panel">
      <h2>Notifications</h2>
      {notifications?.length ? (
        notifications.map((n) => (
          <div
            key={n._id}
            className={`notification ${n.isRead ? 'read' : 'unread'}`}
            onClick={() => !n.isRead && markAsRead(n._id)}
          >
            <p>{n.message}</p>
            <small>{new Date(n.createdAt).toLocaleString()}</small>
          </div>
        ))
      ) : (
        <p>No notifications</p>
      )}
    </div>
  );
};

export default NotificationsPanel;
