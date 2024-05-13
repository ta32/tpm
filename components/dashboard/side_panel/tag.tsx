import React from 'react'
import styles from './tag.module.scss'
import Colors from "../../../styles/colors.module.scss";
import { SELECTABLE_TAG_ICONS } from '../../../lib/Images'
import AllIcon from '../../../svg/tags/all_icon'
import MoreIcon from '../../../svg/ui/more_icon'

interface TagProps {
  id: string;
  permanent?: boolean;
  selected: boolean;
  title: string;
  icon: string;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function Tag({
  title,
  icon,
  selected,
  permanent,
  onEdit,
  onRemove,
  id,
}: TagProps) {
  const [showControls, setShowControls] = React.useState(false);

  if (!selected && showControls) {
    setShowControls(false);
  }

  const handleClickedMore = (e: React.MouseEvent<HTMLImageElement>) => {
    setShowControls(!showControls);
  };

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    onEdit(id);
    setShowControls(false);
  };

  const handleRemove = (e: React.MouseEvent<HTMLDivElement>) => {
    onRemove(id);
    setShowControls(false);
  };

  const iconVisibility = selected && !permanent ? "" : styles.hidden;
  const IconSvg = SELECTABLE_TAG_ICONS.get(icon) ?? AllIcon;
  return (
    <>
      <a
        className={selected ? styles.active : ""}
        data-tag-key={title}
        data-tag-name={title}
      >
        <div className={styles.tag_icon}>
          {IconSvg && <IconSvg width={34} fill={Colors.white} />}
        </div>
        <span className={styles.nav_label}>{title}</span>
        <div className={iconVisibility} onClick={handleClickedMore}>
          <MoreIcon fill={Colors.white} width={24} />
        </div>
      </a>
      {showControls && (
        <div className={`${styles.tag_controls} ${styles.active}`}>
          <div className={styles.tag_control} onClick={handleEdit}>
            Edit
          </div>
          <div className={styles.tag_control} onClick={handleRemove}>
            Remove
          </div>
        </div>
      )}
    </>
  );
}
