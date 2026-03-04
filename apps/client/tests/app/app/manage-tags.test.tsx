import { fireEvent, render, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'

import ManageTagsScreen from '../../../app/(app)/manage-tags'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreateTagMutation } from '@/data/hooks/useCreateTagMutation'
import { useTagsQuery } from '@/data/hooks/useTagsQuery'
import { useUpdateTagMutation } from '@/data/hooks/useUpdateTagMutation'
import { useDeleteTagMutation } from '@/data/hooks/useDeleteTagMutation'
import { router } from 'expo-router'

jest.mock('@/data/hooks/useCreateTagMutation')
jest.mock('@/data/hooks/useTagsQuery')
jest.mock('@/data/hooks/useUpdateTagMutation')
jest.mock('@/data/hooks/useDeleteTagMutation')
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }))

const mockTags = [
  {
    id: 'tag-1',
    uid: 'user-1',
    name: 'Work',
    emoji: '🧰',
    colorToken: 'tagTeal',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'tag-2',
    uid: 'user-1',
    name: 'Personal',
    emoji: '🏠',
    colorToken: 'tagBlue',
    createdAt: '',
    updatedAt: '',
  },
]

const mockUpdateMutate = jest.fn()
const mockDeleteMutate = jest.fn()
const mockCreateMutate = jest.fn()

describe('ManageTagsScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ uid: 'user-1' })
    jest.mocked(useCreateTagMutation).mockReturnValue({
      mutate: mockCreateMutate,
      mutateAsync: jest.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTagMutation>)
    jest.mocked(useTagsQuery).mockReturnValue({
      data: mockTags,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useTagsQuery>)
    jest.mocked(useUpdateTagMutation).mockReturnValue({
      mutate: mockUpdateMutate,
      mutateAsync: jest.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateTagMutation>)
    jest.mocked(useDeleteTagMutation).mockReturnValue({
      mutate: mockDeleteMutate,
      mutateAsync: jest.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteTagMutation>)
    jest.mocked(router.back).mockClear()
    mockCreateMutate.mockClear()
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
    expect(screen.getByTestId('manage-tags-edit-tag-1')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-edit-tag-2')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-delete-tag-1')).toBeOnTheScreen()
    expect(screen.getByTestId('manage-tags-delete-tag-2')).toBeOnTheScreen()
    expect(screen.getByText('🧰 Work')).toBeOnTheScreen()
    expect(screen.getByText('🏠 Personal')).toBeOnTheScreen()
  })

  it('on back press calls router.back', () => {
    render(<ManageTagsScreen />)
    fireEvent.press(screen.getByTestId('manage-tags-back'))
    expect(router.back).toHaveBeenCalled()
  })

  it('opens edit modal and saves full tag payload', () => {
    render(<ManageTagsScreen />)
    fireEvent.press(screen.getByTestId('manage-tags-edit-tag-1'))
    expect(screen.getByTestId('tag-form-name-input')).toBeOnTheScreen()
    fireEvent.changeText(screen.getByTestId('tag-form-name-input'), 'Work Updated')
    fireEvent.press(screen.getByTestId('tag-form-emoji-📚'))
    fireEvent.press(screen.getByTestId('tag-form-color-tagRose'))
    fireEvent.press(screen.getByTestId('tag-form-save'))
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      {
        tagId: 'tag-1',
        body: { name: 'Work Updated', emoji: '📚', colorToken: 'tagRose' },
      },
      expect.any(Object),
    )
  })

  it('opens new-tag modal from the top CTA', () => {
    render(<ManageTagsScreen />)
    fireEvent.press(screen.getByTestId('manage-tags-new-tag'))
    expect(screen.getByTestId('tag-form-name-input')).toBeOnTheScreen()
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
