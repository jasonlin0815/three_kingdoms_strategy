import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CreateDonationPayload, DonationDetail, DonationListItem, TargetOverridePayload } from '@/lib/api/donation-api'

export const donationKeys = {
    all: ['donations'] as const,
    list: (allianceId: string | undefined, seasonId: string | undefined) => [...donationKeys.all, 'list', allianceId, seasonId] as const,
    detail: (id: string | undefined) => [...donationKeys.all, 'detail', id] as const,
}

export function useDonations(allianceId: string | undefined, seasonId: string | undefined) {
    return useQuery<DonationListItem[]>({
        queryKey: donationKeys.list(allianceId, seasonId),
        queryFn: () => {
            if (!allianceId || !seasonId) return Promise.resolve([])
            return apiClient.getDonations(allianceId, seasonId)
        },
        enabled: !!allianceId && !!seasonId,
        staleTime: 60_000,
    })
}

export function useDonationDetail(donationId: string | undefined) {
    return useQuery<DonationDetail>({
        queryKey: donationKeys.detail(donationId),
        queryFn: () => {
            if (!donationId) return Promise.reject(new Error('No id'))
            return apiClient.getDonationDetail(donationId)
        },
        enabled: !!donationId,
    })
}

export function useCreateDonation(allianceId: string | undefined, seasonId: string | undefined) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateDonationPayload) => {
            if (!allianceId || !seasonId) return Promise.reject(new Error('Missing ids'))
            return apiClient.createDonation(allianceId, seasonId, payload)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: donationKeys.list(allianceId, seasonId) })
        },
    })
}

export function useDeleteDonation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => apiClient.deleteDonation(id),
        onSettled: (_data, _error, id) => {
            queryClient.invalidateQueries({ queryKey: donationKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: donationKeys.all })
        },
    })
}

export function useUpsertMemberTargetOverride() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ donationId, payload }: { donationId: string, payload: TargetOverridePayload }) => apiClient.upsertMemberTargetOverride(donationId, payload),
        onSettled: (_data, _error, { donationId }) => {
            queryClient.invalidateQueries({ queryKey: donationKeys.detail(donationId) })
        },
    })
}

export function useDeleteMemberTargetOverride() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ donationId, memberId }: { donationId: string, memberId: string }) => apiClient.deleteMemberTargetOverride(donationId, memberId),
        onSettled: (_data, _error, { donationId }) => {
            queryClient.invalidateQueries({ queryKey: donationKeys.detail(donationId) })
        },
    })
}
