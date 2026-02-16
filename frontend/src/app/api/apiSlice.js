import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials } from "../../features/auth/authSlice";

// Base query setup
const baseQuery = fetchBaseQuery({
  baseUrl: "https://techrepairnotessystembackend.onrender.com",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Token refresh logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 403) {
    console.log("Access token expired — refreshing...");
    const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);

    if (refreshResult?.data) {
      api.dispatch(setCredentials({ ...refreshResult.data }));
      result = await baseQuery(args, api, extraOptions);
    } else {
      if (refreshResult?.error?.status === 403) {
        refreshResult.error.data.message = "Your login has expired.";
      }
      return refreshResult;
    }
  }

  return result;
};

// --- EXTENDED: Notification support added ---
export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Note", "User", "Notification"],
  endpoints: (builder) => ({
    // 🔔 Get all notifications
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),

    // ➕ Create a new notification (e.g., when assigning a task)
    addNotification: builder.mutation({
      query: (newNotification) => ({
        url: "/notifications",
        method: "POST",
        body: newNotification,
      }),
      invalidatesTags: ["Notification"],
    }),

    // ✅ Mark as read (optional)
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "PATCH",
        body: { read: true },
      }),
      invalidatesTags: ["Notification"],
    }),

    // 🗑️ Delete notification (optional)
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetNotificationsQuery,
  useAddNotificationMutation,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} = apiSlice;
