import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, User } from '../api/client'
import toast from 'react-hot-toast'

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const result = await apiClient.getMe()
        return result.user
      } catch {
        return null
      }
    },
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: apiClient.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data.user)
      toast.success('Logged in successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const signupMutation = useMutation({
    mutationFn: apiClient.signup,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data.user)
      toast.success('Account created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: apiClient.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth'], null)
      queryClient.clear()
      toast.success('Logged out successfully')
    },
  })

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isAuthenticated: !!user,
  }
}