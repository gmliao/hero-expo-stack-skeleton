import { fireEvent, render, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'

import ManageTagsScreen from '../../../app/(app)/manage-tags'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useUpdateTagMutation } from '@/data/hooks/useUpdateTagMutation'
import { useDeleteTagMutation } from '@/data/hooks/useDeleteTagMutation'
import { router } from 'expo-router'

jest.mock('@/data/hooks/useTagsQuery')
jest.mock('@/data/hooks/useUpdateTagMutation')
jest.mock('@/data/hooks/useDeleteTagMutation')
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }))

const mockTags = [
  { id: 'tag-1', name: 'Work', createdAt: '', updatedAt: '' },
  { id: 'tag-2', name: 'Personal', createdAt: '', updatedAt: '' },
]

const mockUpdateMutate = jest.fn()
const mockDeleteMutate = jest.fn()

describe('ManageTagsScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: 'user-1' })
    jest.mocked(useTagsQuery).mockReturnValue({
      data: mockTags,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as ReturnType<typeof useTagsQuery>)
    jest.mocked(useUpdateTagMutation).mockReturnValue({
      mutate: mockUpdateMutate,
      mutateAsync: jest.fn(),
      isPending: false,
    } as ReturnType<typeof useUpdateTagMutation>)
    jest.mocked(useDeleteTagMutation).mockReturnValue({
      mutate: mockDeleteMutate,
      mutateAsync: jest.fn(),
      isPending: false,
    } as ReturnType<typeof useDeleteTagMutation>)
    jest.mocked(router.back).mockClear()
    mockUpdateMutate.mockClear()
    mockDeleteMutate.mockClear()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('renders title and back button', () => {
    render(<ManageTagsScreen />)
    expect(screen.getByTestId('manage-tags-title')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-back')).toBeOnTheScreen()
  })

  it('renders list of tags with badge, Rename and Delete buttons', () => {
    render(<ManageTagsScreen />)
    expect(screen.getByTestId('manage-tags-item-tag-1')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-item-tag-2')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-rename-tag-1')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-rename-tag-2')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-delete-tag-1')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-delete-tag-2')).toBeOnTheScreen()
    expect(screen.getByText('Work')).toBeOnTheScreen()
    expect(screen.getByText('Personal')).toBeOnTheScreen()
  })

  it('on back press calls router.back', () => {
    render(<ManageTagsScreen />)
    fireEvent.press(screen.getByTestId('manage-tags-back'))
    expect(router.back).toHaveBeenCalled()
  })

  it('on Rename shows inline input and on save calls updateTagMutation', () => {
    render(<ManageTagsScreen />)
    fireEvent.press(screen.getByTestId('manage-tags-rename-tag-1'))
    expect(screen.getByTestId('manage-tags-edit-input')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-edit-save')).toBeOnTheScreen()
    fireEvent.changeText(screen.getByTestId('manage-tags-edit-input'), 'Work Updated')
    fireEvent.press(screen.getByTestId('manage-tags-edit-save'))
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { tagId: 'tag-1', body: { name: 'Work Updated' } },
      expect.any(Object),
    )
  })

  it('on Delete shows Alert and on confirm calls deleteTagMutation', () => {
    render(<ManageTagsScreen />)
    fireEvent.press(screen.getByTestId('manage-tags-delete-tag-1'))
    expect(Alert.alert).toHaveBeenCalledWith(
      'manageTags.deleteConfirmTitle',
      expect.any(String),
      expect.any(Array),
    )
    const alertCalls = jest.mocked(Alert.alert).mock.calls
    const buttons = alertCalls[0][2] as Array<{ text: string; onPress?: () => void }>
    const deleteButton = buttons.find(b => b.text === 'manageTags.deleteConfirmDelete')
    expect(deleteButton).toBeDefined()
    deleteButton?.onPress?.()
    expect(mockDeleteMutate).toHaveBeenCalledWith('tag-1')
  })
})
