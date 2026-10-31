import { ArrowRight, CalendarDays, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProjectRecord } from '@/features/projects/data/projectsApi'
import styles from './project-card.module.css'

export interface ProjectCardProps {
  project: ProjectRecord
  /** Used to adjust the detail route for mentor/admin and intern views. */
  to?: string
  index?: number
}

const statusLabel = (status: ProjectRecord['status']) =>
  String(status).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export function ProjectCard({ project, to, index = 0 }: ProjectCardProps) {
  const progress = Math.max(0, Math.min(100, Number(project.progress) || 0))
  const href = to ?? `/intern/projects/${encodeURIComponent(project.id)}`

  return (
    <article className={styles.card} style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{project.groupName || 'Project team'}</span>
          <h2 className={styles.title}>{project.name}</h2>
          <span className={styles.status}>{statusLabel(project.status)}</span>
        </div>
        <div className={styles.waves} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className={styles.heroOrb} aria-hidden="true" />
      </div>

      <div className={styles.body}>
        <p className={styles.description}>
          {project.problemStatement?.trim() || 'Your mentor has added you to this project. Open the project to see its tasks and team updates.'}
        </p>

        <div className={styles.progressHead}>
          <span>Project progress</span>
          <strong>{progress}%</strong>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label={`${project.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span className={styles.progressValue} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.meta}>
          <span><UsersRound size={16} aria-hidden="true" />{project.members.length} {project.members.length === 1 ? 'team member' : 'team members'}</span>
          {project.endDate && <span><CalendarDays size={16} aria-hidden="true" />Due {new Date(`${project.endDate.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        </div>

        {project.members.length > 0 && (
          <div className={styles.team} aria-label="Project team">
            <div className={styles.avatars} aria-hidden="true">
              {project.members.slice(0, 4).map((member, memberIndex) => (
                <span key={member.internId} className={styles.avatar} style={{ zIndex: 4 - memberIndex }}>
                  {member.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                </span>
              ))}
            </div>
            <span className={styles.teamNames}>
              {project.members.slice(0, 2).map((member) => member.name).join(', ')}
              {project.members.length > 2 ? ` +${project.members.length - 2}` : ''}
            </span>
          </div>
        )}

        <Link className={styles.link} to={href} state={{ project }}>
          View project details <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export default ProjectCard
