import { fireEvent, render, screen } from '@testing-library/react-native'
import { TagFormModal } from '@/features/todos/TagFormModal'

describe('TagFormModal', () => {
  it('submits name, emoji, and color token', () => {
    const onSubmit = jest.fn()

    render(
      <TagFormModal
        visible
        mode="create"
        onClose={jest.fn()}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    fireEvent.changeText(screen.getByTestId('tag-form-name-input'), 'Work')
    fireEvent.press(screen.getByTestId('tag-form-emoji-⚡'))
    fireEvent.press(screen.getByTestId('tag-form-color-tagAmber'))
    fireEvent.press(screen.getByTestId('tag-form-save'))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Work',
      emoji: '⚡',
      colorToken: 'tagAmber',
    })
  })

  it('prefills values when editing an existing tag', () => {
    render(
      <TagFormModal
        visible
        mode="edit"
        initialValues={{ name: 'Personal', emoji: '🏠', colorToken: 'tagBlue' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByTestId('tag-form-name-input')).toHaveProp('value', 'Personal')
    expect(screen.getByTestId('tag-form-emoji-🏠')).toHaveProp('accessibilityState', {
      selected: true,
    })
    expect(screen.getByTestId('tag-form-color-tagBlue')).toHaveProp('accessibilityState', {
      selected: true,
    })
  })

  it('does not reset dirty edits when parent rerenders with equivalent initial values', () => {
    const { rerender } = render(
      <TagFormModal
        visible
        mode="edit"
        initialValues={{ name: 'Personal', emoji: '🏠', colorToken: 'tagBlue' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        isPending={false}
      />,
    )

    fireEvent.changeText(screen.getByTestId('tag-form-name-input'), 'Personal Updated')
    fireEvent.press(screen.getByTestId('tag-form-emoji-📚'))
    fireEvent.press(screen.getByTestId('tag-form-color-tagRose'))

    rerender(
      <TagFormModal
        visible
        mode="edit"
        initialValues={{ name: 'Personal', emoji: '🏠', colorToken: 'tagBlue' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByTestId('tag-form-name-input')).toHaveProp('value', 'Personal Updated')
    expect(screen.getByTestId('tag-form-emoji-📚')).toHaveProp('accessibilityState', {
      selected: true,
    })
    expect(screen.getByTestId('tag-form-color-tagRose')).toHaveProp('accessibilityState', {
      selected: true,
    })
  })

  it('applies the shared form width constraint on the modal card', () => {
    render(
      <TagFormModal
        visible
        mode="create"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByTestId('tag-form-card')).toHaveProp(
      'className',
      expect.stringContaining('w-full'),
    )
    expect(screen.getByTestId('tag-form-card')).toHaveProp(
      'className',
      expect.stringContaining('max-w-[420px]'),
    )
    expect(screen.getByTestId('tag-form-card')).toHaveProp(
      'className',
      expect.stringContaining('self-center'),
    )
  })
})
