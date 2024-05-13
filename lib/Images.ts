import { FC, SVGProps } from 'react'
import AccountBalanceIcon from '../svg/tags/account_balance_icon'
import BitcoinIcon from '../svg/tags/bitcoin_icon'
import ExchangeIcon from '../svg/tags/exchange_icon'
import AccountCircleIcon from '../svg/tags/account_circle_icon'
import AlternateEmailIcon from '../svg/tags/alternate_email_icon'
import BackupIcon from '../svg/tags/backup_icon'
import BuildIcon from '../svg/tags/build_icon'
import CloudIcon from '../svg/tags/cloud_icon'
import CreditCardIcon from '../svg/tags/credit_card_icon'
import ErrorIcon from '../svg/tags/error_icon'
import FavoriteIcon from '../svg/tags/favorite_icon'
import GradeIcon from '../svg/tags/grade_icon'
import GroupIcon from '../svg/tags/group_icon'
import ImagesModeIcon from '../svg/tags/images_mode_icon'
import LabelImportantIcon from '../svg/tags/label_important_icon'
import LanguageIcon from '../svg/tags/language_icon'
import MonitoringIcon from '../svg/tags/monitoring_icon'
import NotificationImportantIcon from '../svg/tags/notification_important_icon'
import ShoppingBagIcon from '../svg/tags/shopping_bag_icon'
import ShoppingBasketIcon from '../svg/tags/shopping_basket_icon'
import ShoppingCartIcon from '../svg/tags/shopping_cart_icon'
import TravelExploreIcon from '../svg/tags/travel_explore_icon'
import WifiIcon from '../svg/tags/wifi_icon'

export const TAG_ALL = "ALL";
export const TAG_SOCIAL = "group";
export const TAG_BITCOIN = "bitcoin";
export const SELECTABLE_TAG_ICONS: Map<string,FC<SVGProps<SVGSVGElement>>> = new Map([
  [TAG_BITCOIN, BitcoinIcon],
  ["exchange", ExchangeIcon],
  ["account_balance", AccountBalanceIcon],
  ["account_circle", AccountCircleIcon],
  ["alternate_email", AlternateEmailIcon],
  ["backup", BackupIcon],
  ["build", BuildIcon],
  ["cloud", CloudIcon],
  ["credit_card", CreditCardIcon],
  ["error", ErrorIcon],
  ["favorite", FavoriteIcon],
  ["grade", GradeIcon],
  [TAG_SOCIAL, GroupIcon],
  ["images_mode", ImagesModeIcon],
  ["label_important", LabelImportantIcon],
  ["language", LanguageIcon],
  ["monitoring", MonitoringIcon],
  ["notification_important", NotificationImportantIcon],
  ["shopping_bag", ShoppingBagIcon],
  ["shopping_basket", ShoppingBasketIcon],
  ["shopping_cart", ShoppingCartIcon],
  ["travel_explore", TravelExploreIcon],
  ["wifi", WifiIcon],
]);

const enum IMG_PATH {
  DROPBOX = "/images/logos/dropbox/",
  UI = "/images/ui/",
  BACKGROUND = "/images/background/",
  TREZOR = "/images/logos/trezor/",
  APP = "/images/logos/",
}

export class IMAGE_FILE {
  static TRANSPARENT_PNG = new IMAGE_FILE("transparent.png", IMG_PATH.UI);
  static DROPBOX = new IMAGE_FILE("dropbox.svg", IMG_PATH.DROPBOX);
  static DROPBOX_BLUE = new IMAGE_FILE("dropbox-blue.svg", IMG_PATH.DROPBOX);
  static DROPBOX_GREY = new IMAGE_FILE("dropbox-grey.svg", IMG_PATH.DROPBOX);
  static CONNECT_TREZOR = new IMAGE_FILE("connect-trezor.svg", IMG_PATH.TREZOR);
  static TREZOR_1 = new IMAGE_FILE("t1.png", IMG_PATH.TREZOR);
  static TREZOR_2 = new IMAGE_FILE("t2.png", IMG_PATH.TREZOR);
  static TPM_LOGO = new IMAGE_FILE("tpm-logo.svg", IMG_PATH.APP);
  static BACKGROUND = new IMAGE_FILE("tmp_background.png", IMG_PATH.BACKGROUND);
  constructor (private readonly file: string, private readonly basePath: IMG_PATH) {
    this.file = file;
    this.basePath = basePath;
  }
  public path(): string {
    return `${this.basePath}${this.file}`;
  }
}
