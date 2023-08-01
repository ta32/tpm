import React, { useState } from 'react'
import styles from './dashboard.module.scss';
import SidePanel from '../components/dashboard/side_panel';
import PasswordTable from '../components/dashboard/password_table'
import { PasswordEntriesProvider} from '../contexts/password_entries'
import { TagEntriesProvider } from '../contexts/tag_entries'

export default function Dashboard() {
  return (
    <div className={styles.dashboardLayout}>
      <TagEntriesProvider>
        <SidePanel/>
        <section className={styles.content}>
          <PasswordEntriesProvider>
            <PasswordTable/>
          </PasswordEntriesProvider>
        </section>
      </TagEntriesProvider>
    </div>
  )
}
