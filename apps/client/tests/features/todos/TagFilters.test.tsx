import { fireEvent, render, screen } from '@testing-library/react-native'
import { TagFilters } from '@/features/todos/TagFilters'
import type { Tag } from '@shared/types/api'

jest.mock('@/data/hooks/useTagsQuery')

const useTagsQuery = jest.requireMock('@/data/hooks/useTagsQuery').useTagsQuery as jest.Mock

const mockTags: Tag[] = [
  { id: 'tag-1', name: 'Work', uid: 'user-1', createdAt: '', updatedAt: '' },
  { id: 'tag-2', name: 'Personal', uid: 'user-1', createdAt: '', updatedAt: '' },
]

describe('TagFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useTagsQuery.mockReturnValue({ data: mockTags })
  })

  it('renders Tags label, All, and tag names', () => {
    const setSelectedTagId = jest.fn()
    render(
      <TagFilters uid="user-1" selectedTagId={null} setSelectedTagId={setSelectedTagId} />,
    )
    expect(screen.getByText('todos.tagsLabel')).toBeOnTheScreen()
    expect(screen.getByTestId('tag-filter-all')).toBeOnTheScreen()
    expect(screen.getByText('Work')).toBeOnTheScreen()
    expect(screen.getByText('Personal')).toBeOnTheScreen()
  })

  it('calls setSelectedTagId(null) when All is pressed', () => {
    const setSelectedTagId = jest.fn()
    render(
      <TagFilters uid="user-1" selectedTagId="tag-1" setSelectedTagId={setSelectedTagId} />,
    )
    fireEvent.press(screen.getByTestId('tag-filter-all'))
    expect(setSelectedTagId).toHaveBeenCalledWith(null)
  })

  it('calls setSelectedTagId(tag.id) when a tag is pressed', () => {
    const setSelectedTagId = jest.fn()
    render(
      <TagFilters uid="user-1" selectedTagId={null} setSelectedTagId={setSelectedTagId} />,
    )
    fireEvent.press(screen.getByTestId('tag-filter-tag-1'))
    expect(setSelectedTagId).toHaveBeenCalledWith('tag-1')
    fireEvent.press(screen.getByTestId('tag-filter-tag-2'))
    expect(setSelectedTagId).toHaveBeenCalledWith('tag-2')
  })
})
