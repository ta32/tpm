export const TAG_ICONS = [
  "currency_bitcoin_FILL1_wght700_GRAD200_opsz48.svg",
  "currency_exchange_FILL1_wght700_GRAD200_opsz48.svg",
  "account_balance_FILL1_wght700_GRAD200_opsz48.svg",
  "account_circle_FILL1_wght700_GRAD200_opsz48.svg",
  "alternate_email_FILL1_wght700_GRAD200_opsz48.svg",
  "backup_FILL1_wght700_GRAD200_opsz48.svg",
  "build_circle_FILL1_wght700_GRAD200_opsz48.svg",
  "cloud_FILL1_wght700_GRAD200_opsz48.svg",
  "credit_card_FILL1_wght700_GRAD200_opsz48.svg",
  "error_FILL1_wght700_GRAD200_opsz48.svg",
  "favorite_FILL1_wght700_GRAD200_opsz48.svg",
  "grade_FILL1_wght700_GRAD200_opsz48.svg",
  "group_FILL1_wght700_GRAD200_opsz48.svg",
  "imagesmode_FILL1_wght700_GRAD200_opsz48.svg",
  "label_important_FILL1_wght700_GRAD200_opsz48.svg",
  "language_FILL1_wght700_GRAD200_opsz48.svg",
  "monitoring_FILL1_wght700_GRAD200_opsz48.svg",
  "notification_important_FILL1_wght700_GRAD200_opsz48.svg",
  "shopping_bag_FILL1_wght700_GRAD200_opsz48.svg",
  "shopping_basket_FILL1_wght700_GRAD200_opsz48.svg",
  "shopping_cart_FILL1_wght700_GRAD200_opsz48.svg",
  "travel_explore_FILL1_wght700_GRAD200_opsz48.svg",
  "wifi_FILL1_wght700_GRAD200_opsz48.svg",
];

export function getTagIconPath(icon: string): string {
  return `/images/icons/tags/${icon}`;
}

export function getUiIconPath(icon: UI_ICON): string {
  return `/images/icons/ui/${icon}`;
}

export function getBackgroundImagePath(image: string): string {
  return `/images/background/${image}`;
}

export function getTrezorLogoPath(image: string): string {
  return `/images/logos/trezor/${image}`;
}

export function getDropboxLogoPath(image: string): string {
  return `/images/logos/dropbox/${image}`;
}

export function getAppLogoPath(image: string): string {
  return `/images/logos/${image}`;
}

export enum UI_ICON {
  SORT = "sort_FILL1_wght700_GRAD200_opsz48.svg",
  DONE = "done_FILL1_wght700_GRAD200_opsz48.svg",
  MORE = "more_horiz_FILL1_wght700_GRAD200_opsz48.svg",
  CLOSE = "close_FILL1_wght700_GRAD200_opsz48.svg",
  NO_SEARCH = "nosearch.svg",
  TRANSPARENT_PNG = "transparent.png",
}
export const TAG_ALL = "apps_FILL1_wght700_GRAD200_opsz48.svg";
export const TAG_BITCOIN = "currency_bitcoin_FILL1_wght700_GRAD200_opsz48.svg";
export const TAG_SOCIAL = "group_FILL1_wght700_GRAD200_opsz48.svg";


