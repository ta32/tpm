import React from 'react';
import styles from './Tag.module.scss';
import Colors from 'styles/colors.module.scss';
import { SELECTABLE_TAG_ICONS } from 'lib/images';
import AllIcon from 'components/svg/tags/AllIcon';
import MoreIcon from 'components/svg/ui/MoreIcon';
import { DEFAULT_TAGS } from 'contexts/tag-entries.context';

interface TagProps {
  id: string;
  selected: boolean;
  title: string;
  icon: string;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function Tag({ title, icon, selected, onEdit, onRemove, id }: TagProps) {
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

  const showMoreControls = selected && id != DEFAULT_TAGS.ALL ? '' : styles.hidden;
  const IconSvg = SELECTABLE_TAG_ICONS.get(icon) ?? AllIcon;
  return (
    <>
      <a className={selected ? styles.active : ''} data-tag-key={title} data-tag-name={title}>
        <div className={styles.tag_icon}>{IconSvg && <IconSvg width={34} fill={Colors.white} />}</div>
        <span data-cy="tag-title-span" className={styles.nav_label}>{title}</span>
        <div className={showMoreControls} onClick={handleClickedMore}>
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
