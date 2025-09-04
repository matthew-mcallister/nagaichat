'use client'

import { reportError } from '@/lib/error'
import { Api, Session } from '@/lib/frontend/api'
import { EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import styles from './SessionList.module.scss'

interface SessionListProp {
  current?: Session
}

/**
 * List of previous sessions from the left-hand navigation sidebar.
 */
export default function SessionList({ current }: SessionListProp) {
  const [processing, setProcessing] = useState<boolean>(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const router = useRouter()
  const api = new Api()
  const sessions = api.useSessions()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const disabled = processing

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  async function handleSessionClick(session: Session) {
    if (processing) return
    setProcessing(true)
    try {
      router.push(`/session/${session.id}`)
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
    }
  }

  async function handleMenuClick(e: React.MouseEvent, sessionId: number) {
    if (processing) return
    e.stopPropagation()
    setOpenMenuId(openMenuId === sessionId ? null : sessionId)
  }

  async function handleDeleteClick(e: React.MouseEvent, sessionId: number) {
    if (processing) return
    e.stopPropagation()
    setProcessing(true)
    try {
      setOpenMenuId(null)
      await api.deleteSession(sessionId)
      if (sessionId === current?.id) {
        router.push(`/`)
      }
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
    }
  }

  if (!sessions) {
    return <div className={styles.loading}>Loading sessions...</div>
  }

  if (sessions.length === 0) {
    return <div className={styles.empty}>No sessions yet</div>
  }

  return (
    <ul className={styles.sessionList}>
      {sessions.map(session => (
        <li
          key={session.id}
          className={`
            ${styles.sessionItem}
            ${current?.id === session.id ? styles.current : ''}
            ${disabled ? styles.disabled : ''}
            ${openMenuId === session.id ? styles.open : ''}
          `}
          onClick={() => handleSessionClick(session)}
        >
          <div className={styles.sessionName} title={session.name}>
            {session.name}
          </div>

          <div className={styles.menuContainer}>
            <button
              className={styles.menuButton}
              onClick={e => handleMenuClick(e, session.id)}
              aria-label='Session options'
            >
              <EllipsisHorizontalIcon className={styles.menuIcon} />
            </button>
          </div>

          {openMenuId === session.id && (
            <div
              className={styles.dropdown}
              ref={openMenuId === session.id ? dropdownRef : null}
            >
              <button
                className={styles.dropdownItem}
                onClick={e => handleDeleteClick(e, session.id)}
              >
                <TrashIcon className={styles.dropdownIcon} />
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
