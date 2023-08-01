import React, { useState } from 'react'
import styles from './dashboard.module.scss';
import SidePanel from '../components/dashboard/side_panel';
import PasswordTable from '../components/dashboard/password_table'
import { PasswordEntriesProvider} from '../contexts/password_entries'
import { TagEntriesProvider } from '../contexts/tag_entries'
import LoaderModal from '../components/dashboard/loader_modal'

export default function Dashboard() {
  return (
    <div className={styles.dashboardLayout}>
      <TagEntriesProvider>
        <SidePanel/>
        <section className={styles.content}>
          <PasswordEntriesProvider>
            <PasswordTable/>
            <LoaderModal/>
          </PasswordEntriesProvider>
        </section>
      </TagEntriesProvider>
    </div>
  )
}
