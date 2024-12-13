import React, { useState } from 'react';
import Image from 'next/image';
import styles from './SidePanel.module.scss';
import { useTagEntries, useTagEntriesDispatch } from '../../contexts/use-tag-entries';
import TagModal from './SidePanel/TagModal';
import { getTags, TagEntry, TagsStatus } from '../../contexts/reducers/tag-entries-reducer';
import Tag from './SidePanel/Tag';
import { IMAGE_FILE } from '../../lib/images';

interface Add {
  type: 'ADD';
}

interface Remove {
  type: 'REMOVE';
  tagId: string;
}

interface Edit {
  type: 'EDIT';
  tagId: string;
}

interface Close {
  type: 'CLOSED';
}

type TagModalAction = Add | Remove | Edit | Close;

interface SidePanelProps {
  onSelectedTag: (tagId: string) => void;
}

export default function SidePanel({ onSelectedTag }: SidePanelProps) {
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [tagModalAction, setTagModalAction] = useState<TagModalAction>({
    type: 'CLOSED',
  });
  const tagEntries = useTagEntries();
  const tagEntriesDispatch = useTagEntriesDispatch();

  let mode = tagModalAction.type;
  if (tagEntries.status === TagsStatus.SYNCED && tagModalAction.type === 'CLOSED') {
    mode = 'CLOSED';
  }

  function handleSelect(e: React.MouseEvent<HTMLLIElement>) {
    const tagId = e.currentTarget.id;
    onSelectedTag(tagId);
    setSelectedTag(tagId);
  }

  function handleAddTag() {
    setTagModalAction({ type: 'ADD' });
  }

  const handleCloseTag = () => {
    tagEntriesDispatch({ type: 'CLEAR_ERROR' });
    setTagModalAction({ type: 'CLOSED' });
  };

  const handleSubmitNewTag = (tag: { title: string; icon: string }) => {
    if (tagModalAction.type === 'ADD') {
      tagEntriesDispatch({ type: 'ADD_TAG', title: tag.title, icon: tag.icon });
    }
    if (tagModalAction.type === 'EDIT') {
      tagEntriesDispatch({
        type: 'UPDATE_TAG',
        tagId: tagModalAction.tagId,
        title: tag.title,
        icon: tag.icon,
      });
    }
    if (tagModalAction.type === 'REMOVE') {
      tagEntriesDispatch({ type: 'REMOVE_TAG', tagId: tagModalAction.tagId });
    }
    setTagModalAction({ type: 'CLOSED' });
  };

  const handleRemoveTag = (id: string) => {
    setTagModalAction({ tagId: id, type: 'REMOVE' });
  };

  const handleEditTag = (id: string) => {
    setTagModalAction({ tagId: id, type: 'EDIT' });
  };

  const tagId = (() => {
    if (tagModalAction.type === 'EDIT' || tagModalAction.type === 'REMOVE') {
      return tagModalAction.tagId;
    } else {
      return undefined;
    }
  })();

  return (
    <div className={styles.left_panel_wrapper}>
      <TagModal onClosed={handleCloseTag} onSubmit={handleSubmitNewTag} mode={mode} tagId={tagId} />
      <aside
        className={styles.left_panel}
        style={{
          backgroundImage: `url(${IMAGE_FILE.BACKGROUND.path()})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className={styles.logo}>
          <span className="logo-expanded">
            <Image src={IMAGE_FILE.TPM_LOGO.path()} alt="logo" height={34} width={141} />
          </span>
        </div>

        <nav className={styles.navigation}>
          <ul className={styles.list_unstyled}>
            {tagList({
              selectedId: selectedTag,
              tags: getTags(tagEntries),
              onRemove: handleRemoveTag,
              onEdit: handleEditTag,
              onSelect: handleSelect,
            })}
            <li className={`${styles.add_tag_btn} ${styles.fadeIn}`}>
              <a onClick={handleAddTag} className={''}>
                <span className={styles.nav_label}>Add tag</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
}

function tagList({
  selectedId,
  tags,
  onRemove,
  onEdit,
  onSelect,
}: {
  selectedId: string | undefined;
  tags: TagEntry[];
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onSelect: (e: React.MouseEvent<HTMLLIElement>) => void;
}) {
  const tag_array = [];
  for (const tag of tags) {
    const tagId = tag.id;
    const selected = selectedId === tagId;
    tag_array.push(
      <li id={tagId} key={tagId} className={styles.fadeIn} onClick={onSelect}>
        <Tag id={tagId} onEdit={onEdit} onRemove={onRemove} selected={selected} title={tag.title} icon={tag.icon}></Tag>
      </li>
    );
  }
  return tag_array;
}
