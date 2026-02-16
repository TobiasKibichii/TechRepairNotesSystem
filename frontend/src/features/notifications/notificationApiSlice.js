import { apiSlice } from "../../app/api/apiSlice"

export const notificationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: () => '/notifications',
            providesTags: (result = [], error, arg) => [
                'Notification',
                ...result.map(({ id }) => ({ type: 'Notification', id }))
            ]
        }),

        addNotification: builder.mutation({
            query: (notificationData) => ({
                url: '/notifications',
                method: 'POST',
                body: notificationData
            }),
            invalidatesTags: ['Notification']
        }),

        markAsRead: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'PATCH',
                body: { read: true }
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Notification', id: arg }]
        }),

        deleteNotification: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Notification']
        }),
    }),
})

export const {
    useGetNotificationsQuery,
    useAddNotificationMutation,
    useMarkAsReadMutation,
    useDeleteNotificationMutation,
} = notificationApiSlice
