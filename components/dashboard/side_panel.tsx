import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './side_panel.module.scss'
import { useTagEntries, useTagEntriesDispatch } from '../../contexts/tag_entries'
import TagModal from './side_panel/tag_modal'
import { getTags, TagEntry, TagsStatus } from '../../contexts/reducers/tag_entries'
import Tag from './side_panel/tag'

interface Add {
  type: "ADD"
}

interface Remove {
  type: "REMOVE"
  tagId: string;
}

interface Edit {
  type: "EDIT"
  tagId: string;
}

interface Close {
  type: "CLOSED"
}

type TagModalAction = Add | Remove | Edit | Close;

export default function SidePanel() {
  const [selectedTag, setSelectedTag] = useState<string|undefined>(undefined);
  const [tagModalAction, setTagModalAction] = useState<TagModalAction>({
    type: "CLOSED"
  });
  const tags = useTagEntries();
  const tagsDispatch = useTagEntriesDispatch();

  useEffect(() => {
    console.log("status: ", tags.status);
    if (tags.status !== TagsStatus.ERROR) {
      setTagModalAction({type: "CLOSED"});
    }
  }, [tags, tagsDispatch])

  function handleSelect(e: React.MouseEvent<HTMLLIElement>) {
    const tagId = e.currentTarget.id;
    setSelectedTag(tagId);
  }

  function handleAddTag() {
    setTagModalAction({type: "ADD"});
  }

  const handleCloseTag = () => {
    setTagModalAction({type: "CLOSED"});
  }

  const handleSubmitNewTag = (tag: {title: string, icon: string}) => {
    if (tagModalAction.type === "ADD") {
      tagsDispatch({type: 'ADD_TAG', title: tag.title, icon: tag.icon});
    }
    if (tagModalAction.type === "EDIT") {
      tagsDispatch({type: 'UPDATE_TAG', tagId: tagModalAction.tagId, title: tag.title, icon: tag.icon});
    }
    if (tagModalAction.type === "REMOVE") {
      tagsDispatch({type: 'REMOVE_TAG', tagId: tagModalAction.tagId});
    }
  }

  const handleRemoveTag = (id: string) => {
    setTagModalAction({tagId: id, type: "REMOVE"});
  }

  const handleEditTag = (id: string) => {
    setTagModalAction({tagId: id, type: "EDIT"})
  }

  const tagId = (() => {
    if (tagModalAction.type === "ADD" || tagModalAction.type === "CLOSED") {
      return undefined;
    } else {
      return tagModalAction.tagId;
    }
  })();
  return (
    <div className={styles.left_panel_wrapper}>
      <TagModal onClosed={handleCloseTag} onDiscard={handleCloseTag} onSubmit={handleSubmitNewTag} mode={tagModalAction.type} tagId={tagId}/>
      <div className="backdrop" /*onClick={onSelectTag} TODO */ />
      <aside className={styles.left_panel}>
        <div className={styles.logo}>
              <span className="logo-expanded">
                <Image src="/images/tpm-logo.svg" alt="logo" height={34} width={141} />
              </span>
        </div>

        <nav className={styles.navigation}>
          <ul className={styles.list_unstyled}>
            {tagList({
              selectedId: selectedTag,
              tags: getTags(tags),
              onRemove: handleRemoveTag,
              onEdit: handleEditTag,
              onSelect: handleSelect}
            )}
            <li className={`${styles.add_tag_btn} ${styles.fadeIn}`}>
              <a onClick={handleAddTag} className={''}>
                <span className={styles.nav_label}>Add tag</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  )
}

function tagList({selectedId, tags, onRemove, onEdit, onSelect}: {
  selectedId: string|undefined,
  tags: TagEntry[],
  onRemove: (id: string) => void,
  onEdit: (id: string) => void,
  onSelect: (e: React.MouseEvent<HTMLLIElement>) => void }
) {
  const tag_array = [];
  for (const tag of tags) {
    const tagId = tag.id;
    const permanent = tagId === '0';
    const selected =  selectedId === tagId;
    tag_array.push(
      <li id={tagId} key={tagId} className={styles.fadeIn} onClick={onSelect}>
        <Tag id={tagId} onEdit={onEdit} onRemove={onRemove} permanent={permanent} selected={selected} title={tag.title} icon={tag.icon}></Tag>
      </li>
    )
  }
  return tag_array;
}
