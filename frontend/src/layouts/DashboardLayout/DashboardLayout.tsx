import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './DashboardLayout.module.css'
export function DashboardLayout() { return <Box className={styles['dashboard-layout']}><Sidebar /><Box className={styles['dashboard-main']}><Topbar /><Box component="main" className={styles['dashboard-content']}><Outlet /></Box></Box></Box> }
export default DashboardLayout
