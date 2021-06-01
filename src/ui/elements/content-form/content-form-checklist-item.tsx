import { Fragment, h } from 'preact'
import type { FunctionComponent as FC } from 'preact'
import { useCallback, useMemo, useEffect, useRef } from 'preact/hooks'
import cn from 'classnames'

import {
  CHECKLIST_CHECK_MARK_LENGTH,
} from '~/tools/handle-checklist'
import { Input } from '~/ui/elements/input'
import { Button } from '~/ui/elements/button'
import { DragIcon, CrossIcon } from '~/ui/icons/'

import styles from './content-form.styl'

type Props = {
  item: string
  index: number
  length: number
  itemPlaceholder?: string
  draggingIndex?: number | null
  draggingValue?: string
  enteringIndex?: number | null
  handleInputItem: (value: string, index: number) => void
  handleDeleteItem: (index: number) => void
  handleDragStartItem: (index: number) => void
  handleDragEnterItem: (index: number) => void
  handleDragEndItem: () => void
  handleLastMount: () => void
}

export const ContentFormChecklistItem: FC<Props> = ({
  item,
  index,
  length,
  itemPlaceholder,
  draggingIndex,
  draggingValue,
  enteringIndex,
  handleInputItem,
  handleDeleteItem,
  handleDragStartItem,
  handleDragEnterItem,
  handleDragEndItem,
  handleLastMount
}) => {
  const isFirstItem = useMemo(() => {
    return index === 0
  }, [index])

  const isLastItem = useMemo(() => {
    return index === length - 1
  }, [index, length])

  const isEntering = useMemo(() => {
    return (
      [draggingIndex, enteringIndex].every(index => typeof index === 'number') &&
      draggingIndex !== enteringIndex &&
      (enteringIndex === index || (enteringIndex === length - 1 && index === length - 1))
    )
  }, [index, draggingIndex, enteringIndex, length])

  const handleInput = useCallback((value) => {
    return handleInputItem(value, index)
  }, [index, handleInputItem])

  const handleDelete = useCallback(() => {
    return handleDeleteItem(index)
  }, [index, handleDeleteItem])

  const handleDragStart = useCallback(() => {
    return handleDragStartItem(index)
  }, [index, handleDragStartItem])

  const handleDragEnter = useCallback(() => {
    return handleDragEnterItem(index)
  }, [index, handleDragEnterItem])

  const handleDragEnd = useCallback(() => {
    return handleDragEndItem()
  }, [index, handleDragEndItem])

  useEffect(() => {
    if (!isLastItem) return
    handleLastMount()
  }, [])

  return (
    <Fragment>
      {isEntering && (draggingIndex! > enteringIndex! || enteringIndex === length - 1) && (
        <div class={styles.fakeChecklistItem}>
          {draggingValue?.slice(CHECKLIST_CHECK_MARK_LENGTH)}
        </div>
      )}
      <div
        class={cn(
          styles.checklistItem,
          draggingIndex === index && styles._dragging
        )}
        key={index}
      >
        <div
          class={styles.checklistItemIcon}
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDragEnd={handleDragEnd}
          draggable={!isLastItem}
        >
          {!isLastItem && (
            <DragIcon/>
          )}
        </div>
        <Input
          class={styles.input}
          value={item.slice(CHECKLIST_CHECK_MARK_LENGTH)}
          placeholder={itemPlaceholder}
          border={false}
          autoFocus={isFirstItem && isLastItem}
          onInput={handleInput}
        />
        {!isLastItem && (
          <Button
            class={cn(
              styles.button,
              styles._small
            )}
            icon={<CrossIcon/>}
            onClick={handleDelete}
          />
        )}
      </div>
      {isEntering && draggingIndex! < enteringIndex! && enteringIndex !== length - 1 && (
        <div class={styles.fakeChecklistItem}>
          {draggingValue?.slice(CHECKLIST_CHECK_MARK_LENGTH)}
        </div>
      )}
    </Fragment>
  )
}
