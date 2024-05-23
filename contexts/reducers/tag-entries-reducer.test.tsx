import {
  AddTag,
  getTags,
  getTagTitle,
  RemoveTag,
  SyncTags,
  TagEntry,
  tagsReducer,
  TagsStatus,
  UpdateTag,
} from './tag-entries-reducer';

const INITIAL_TAGS = {
  all: {
    id: 'all',
    title: 'ALL',
    icon: 'ALL',
  },
  bitcoin: {
    id: 'bitcoin',
    title: 'Bitcoin',
    icon: 'Bitcoin',
  },
  'social-media': {
    id: 'social-media',
    title: 'Social Media',
    icon: 'Banking',
  },
  status: TagsStatus.UNINITIALIZED,
  lastError: '',
};

it('use default tags if no tags are synced from the app data', () => {
  const syncTagsEmpty: SyncTags = {
    type: 'SYNC_TAGS',
    tags: undefined,
  };

  const actualTags = tagsReducer(INITIAL_TAGS, syncTagsEmpty);
  expect(actualTags.status).toEqual(TagsStatus.SYNCED);
});

it('cannot add duplicate tags', () => {
  const addTag: AddTag = {
    type: 'ADD_TAG',
    title: 'Bitcoin',
    icon: 'Bitcoin',
  };

  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.SYNCED };
  const actualTags = tagsReducer(syncedTags, addTag);
  expect(actualTags.status).toEqual(TagsStatus.ERROR);

  // error should be clear after changing the tag
  const addTag2: AddTag = {
    type: 'ADD_TAG',
    title: 'Bitcoin2',
    icon: 'Bitcoin',
  };

  const actualTags2 = tagsReducer(actualTags, addTag2);
  expect(actualTags2.status).toEqual(TagsStatus.SAVE_REQUIRED);
});

it('cannot add tags if state is not synced', () => {
  const addTag: AddTag = {
    type: 'ADD_TAG',
    title: 'New Tag',
    icon: 'Ethernet',
  };

  const actualTags = tagsReducer(INITIAL_TAGS, addTag);
  expect(actualTags.status).toEqual(TagsStatus.UNINITIALIZED);
});

it('remove tag', () => {
  const removeTag: RemoveTag = {
    type: 'REMOVE_TAG',
    tagId: 'bitcoin',
  };

  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.SYNCED };
  const actualTags = tagsReducer(syncedTags, removeTag);
  expect(actualTags.status).toEqual(TagsStatus.SAVE_REQUIRED);
  expect(actualTags['bitcoin']).toBeUndefined();
});

it('remove tag then add new tags', () => {
  const addTag1: AddTag = {
    type: 'ADD_TAG',
    title: 'New Tag',
    icon: 'Ethernet',
  };
  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.SYNCED };
  let actualTags = tagsReducer(syncedTags, addTag1);

  // simulate saving the tags
  syncedTags.status = TagsStatus.SYNCED;

  let tagsList = getTags(actualTags);
  const addTag1Id = tagsList[tagsList.length - 1].id;

  const removeTag: RemoveTag = {
    type: 'REMOVE_TAG',
    tagId: addTag1Id,
  };
  actualTags = tagsReducer(actualTags, removeTag);

  // simulate saving the tags
  syncedTags.status = TagsStatus.SYNCED;

  const addTag2: AddTag = {
    type: 'ADD_TAG',
    title: 'New Tag2',
    icon: 'Ethernet2',
  };
  actualTags = tagsReducer(actualTags, addTag2);

  tagsList = getTags(actualTags);
  const addTag2Id = tagsList[tagsList.length - 1].id;

  expect(actualTags.status).toEqual(TagsStatus.SAVE_REQUIRED);
  expect(actualTags[addTag2Id]).toBeDefined();
});

it('update tag', () => {
  const updateTag: UpdateTag = {
    type: 'UPDATE_TAG',
    tagId: 'bitcoin',
    title: 'Bitcoin2',
    icon: 'Bitcoin',
  };

  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.SYNCED };
  const actualTags = tagsReducer(syncedTags, updateTag);

  expect(actualTags.status).toEqual(TagsStatus.SAVE_REQUIRED);
  const actualTagsList = getTags(actualTags);
  // expect te order to remain the same
  expect(actualTagsList[1].title).toEqual('Bitcoin2');
});

it('should not be able to update tag if the new value conflicts with an existing tag', () => {
  const updateTag: UpdateTag = {
    type: 'UPDATE_TAG',
    tagId: 'bitcoin',
    title: 'Social Media',
    icon: 'Bitcoin',
  };
  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.SYNCED };
  const actualTags = tagsReducer(syncedTags, updateTag);
  expect(actualTags.status).toEqual(TagsStatus.ERROR);
});

it('should be able to update the icon of the same tag', () => {
  const updateTagIcon: UpdateTag = {
    type: 'UPDATE_TAG',
    tagId: 'bitcoin',
    title: 'Bitcoin',
    icon: 'BitcoinCash',
  };
  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.SYNCED };
  const actualTags = tagsReducer(syncedTags, updateTagIcon);
  expect(actualTags.status).toEqual(TagsStatus.SAVE_REQUIRED);
  expect((actualTags['bitcoin'] as TagEntry).icon).toEqual('BitcoinCash');
});

it('returns tags', () => {
  const actualTagsList = getTags(INITIAL_TAGS);
  for (const tag of actualTagsList) {
    expect(tag.title).toBeDefined();
    expect(tag.icon).toBeDefined();
  }
  expect(actualTagsList.length).toEqual(3);
});

it('get tag tile', () => {
  const actualTitle = getTagTitle(INITIAL_TAGS, 'bitcoin');
  expect(actualTitle).toEqual('Bitcoin');

  let notTitle = getTagTitle(INITIAL_TAGS, 'ax');
  expect(notTitle).toEqual('');

  notTitle = getTagTitle(INITIAL_TAGS, 'status');
  expect(notTitle).toEqual('');
});

it('add tag after error', () => {
  const addTag: AddTag = {
    type: 'ADD_TAG',
    title: 'Bitcoin',
    icon: 'Bitcoin',
  };

  const syncedTags = { ...INITIAL_TAGS, status: TagsStatus.ERROR };
  const actualTags = tagsReducer(syncedTags, addTag);
  expect(actualTags.status).toEqual(TagsStatus.ERROR);

  const addTag2: AddTag = {
    type: 'ADD_TAG',
    title: 'Bitcoin2',
    icon: 'Bitcoin',
  };

  const actualTags2 = tagsReducer(actualTags, addTag2);
  expect(actualTags2.status).toEqual(TagsStatus.SAVE_REQUIRED);
});
