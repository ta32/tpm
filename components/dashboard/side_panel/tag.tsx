import React, { useEffect } from 'react'
import styles from './tag.module.scss'
import Image from 'next/image'
import { getTagIconPath, getUiIconPath, UI_MORE } from '../../../lib/icons'

interface TagProps {
  id: string;
  permanent?: boolean;
  selected: boolean;
  title: string;
  icon: string;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function Tag({title, icon, selected, permanent, onEdit, onRemove, id}: TagProps) {
  const [showControls, setShowControls] = React.useState(false);

  if(!selected && showControls) {
    setShowControls(false);
  }

  const handleClickedMore = (e: React.MouseEvent<HTMLImageElement>) => {
    setShowControls(!showControls);
  }

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    onEdit(id);
    setShowControls(false);
  }

  const handleRemove = (e: React.MouseEvent<HTMLDivElement>) => {
    onRemove(id);
    setShowControls(false);
  }

  const iconVisibility = selected && !permanent ? '': styles.hidden
  return (
    <>
      <a className={selected ? styles.active : ''} data-tag-key={title} data-tag-name={title}>
        <Image className={`${styles.ui_icon_white} ${styles.tag_icon}`} src={getTagIconPath(icon)} alt={"icon"} width={55} height={55}/>
        <span className={styles.nav_label}>{title}</span>
        <Image onClick={handleClickedMore} className={`${styles.ui_icon_white} ${iconVisibility}`} src={getUiIconPath(UI_MORE)} alt={"more"} height={24} width={24} />
      </a>
      {showControls &&
        <div className={`${styles.tag_controls} ${styles.active}`}>
          <div className={styles.tag_control} onClick={handleEdit}>Edit</div>
          <div className={styles.tag_control} onClick={handleRemove}>Remove</div>
        </div>
      }
    </>
  )
}

