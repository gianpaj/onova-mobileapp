import defaults from '../../utils/defaults';
import settings from '../../config/settings';

export default {
  intro: {
    skip: 'Skip',
    next: 'Next',
    step_1: {
      title: 'Buy safely',
      subtitle: `Buy things safely with UAPAY™ Safe Purchase


 `,
    },
    step_2: {
      title: 'Sell easily',
      subtitle: `Make a professional seller page under a minute


 `,
    },
    step_3: {
      title: 'Follow shops',
      subtitle: `The more shops you follow the more items you see on your homepage

 `,
    },
  },
  sign_up_login_tabs: {
    signup: 'SIGNUP',
    login: 'LOGIN',
  },
  login: {
    email_placeholder: 'Email',
    password_placeholder: 'Password',
    log_in_button: 'Log in',
    forgot_password: 'Forgot Password?',
    reset_password: {
      title: 'Trouble logging in?',
      info: 'Enter your email address to reset your password',
      button: 'Email instructions',
    },
    verify_account: {
      title:
        'One step left! Check your inbox for a confirmation email and click on the link.',
    },
    retry: 'Try again',
  },
  signup: {
    username_placeholder: 'Username',
    email_placeholder: 'Email',
    password_placeholder: 'Password (minimum 8 characters)',
    sign_up_button: 'Create account',
    terms_text_1: 'By pressing Create account you agree to the',
    terms_text_3: 'Privacy Policy,',
    terms_text_2: 'Terms,',
    terms_text_4: 'Safe Purchase Rules',
  },
  home: {
    clothes_tab: 'Clothes',
    shoes_tab: 'Shoes',
    other_tab: 'Other',
    share:
      'Android: https://play.google.com/store/apps/details?id=com.onova.app&hl=uk - Apple Store: https://itunes.apple.com/ua/app/onova/id1365771422?mt=8',
    alert_info_title: 'Information',
    alert_info_body: `1. On the homepage you first the items from the sellers you follow, then everybody else's.

2. To upload multiple items at once or from a computer use:
http://onova.co/uploader

3. If you have any questions please chat to @onova user`,
  },
  image_grid: {
    error: 'Error fetching listing',
    empty_state_title: 'There are no items in your feed',
    empty_state_body: 'Follow sellers to see items available for you to buy',
    empty_state_button: 'Find Sellers to Follow',
  },
  image_grid_search: {
    empty_state_title: "We couldn't find any items",
    empty_state_body: 'Try searching with some other options',
  },
  product: {
    buy_button: 'Buy',
    reserved_button: 'Reserved',
    reserved_message: 'Check in 15 mins. It might be available again',
    alert_confirm_delete: 'Confirm deletion?',
    toast_warning_on_unverified_account:
      'Please verify your email address to buy an item. Check your inbox',
    toast_warning_on_product_sold: 'This item is not longer for sale',
    toast_warning_ok_button: 'OK',
    alert_report_title: 'Report Item?',
    share_before: 'Invite your friends to chat on Onova',
  },
  comments: {
    add_comment_placeholder: 'Add a comment',
    alert_confirm_deletion: 'Confirm deletion?',
    toast_warning_mention_not_found: 'User not found',
    toast_warning_on_unverified_account:
      'Please verify your email address to write a comment. Check your inbox',
  },
  alerts: {
    email_error: 'An account with that email address does not exist',
    password_error: 'The password is incorrect',
    loading_message: 'Loading...',
    network_error: 'Connectivity issue. Please check your internetz',
    confirm_alert_button_cancel: 'Cancel',
    confirm_alert_button_confirm: 'Confirm',
    // `Thank you for helping keep the Onova community safe and fun for everyone. Remember, we don't reveal who submitted reports to the seller.`
    report_subtitle: 'Enter reason (required)',
    report_error: 'Please give a longer reason. Min 7 characters',
    report_success: 'Thank you for helping keep the Onova community safe',
    action_button_close: 'Close',
    action_button_block: 'Block',
    action_button_cancel: 'Cancel',
    action_button_delete: 'Delete',
    action_button_edit: 'Edit',
    action_button_report: 'Report',
    toast_uploading: 'Uploading...',
  },
  search: {
    header: 'Search',
    tags_tab: '#Tags',
    shops_tab: '@Shops',
    empty_state_message: 'No users found',
    error: 'Error while searching',
    hashtag_placeholder: 'hashtag',
    search_button: 'Search',
    username_placeholder: 'username',
  },
  categories: {
    clothes: 'Clothes',
    shoes: 'Shoes',
    other_cat: 'Other',
    men: 'Men',
    women: 'Women',
    other_type: 'Other',
  },
  add_or_edit_item: {
    add_item_header: 'Add Item',
    cropper_toolbar_title: 'Edit Photo',
    cropper_choose_text: 'Choose',
    cropper_cancel_text: 'Cancel',
    image_processing: 'Loading images',
    edit_item_header: 'Edit Item',
    price_label: 'Price:',
    price_placeholder: `min ${settings.MIN_PRICE} UAH`,
    description_label: 'Description:',
    description_placeholder:
      'Please provide details such as brand, size and condition about the item',
    hashtags_label: '#tags:',
    hashtags_placeholder: 'adidas, 43',
    select_photo_source_camera: 'Camera',
    select_photo_source_gallery: 'Gallery',
    select_photo_source_cancel: 'Cancel',
    too_many_images: 'An item can have up to 6 images',
    min_price: 'The minimum price is',
    info_popup: `Чим якісніші твої фотографії тим більше ймовірності в тебе щось придбають:

1. Фон
Якщо є білий фон, використовуй його - згідно багатьох досліджень, білий фон збільшує продажі на 40%

2. Розташування товару
Слідкуй щоб весь товар влізав в квадрат зображення і роби фото з різних сторін товару

3. Став свій тег
Якщо хочеш додаткової довіри з боку покупця - просто напиши десь на листочку і постав свій @username в фото.`,
  },
  create_drop: {
    title: 'Create Drop',
    ok: 'OK',
    cancel: 'Cancel',
    select: 'Select a date when you want the drop',
    success: 'Your drop has been scheduled!',
    permission_title: 'Can we access your location?',
    permission_message: 'Onova uses your location when adding a new item',
    permission_alert_button_settings: 'Open Settings',
    cannot_create_drop_alert:
      'Please go to Settings first to enter your Shipping info, mobile number and card details',
  },
  confirm_order: {
    header: 'Confirm order',
    buying_item_text: 'Wants to buy your item',
    confirm: 'Confirm',
    button_cancel_order: 'Cancel order',
    dialog_title: 'Are you sure to cancel the order?',
    reason_placeholder: 'Write why you are cancelling the order',
    error_reason_is_mandatory: 'Please enter a reason',
  },
  drops_grid: {
    empty_state_title: 'Make a Drop',
    empty_state_message_mine:
      'Schedule multiple items to be posted at the same time to create demand',
    empty_state_button_mine: 'Make a Drop',
    empty_state_message_others: 'There are no drops yet',
  },
  profile: {
    reviews_label: 'reviews',
    followers_label: 'followers',
    following_label: 'following',
    edit_profile_button: 'Edit Profile',
    save_profile_button: 'Save',
    follow_button: 'Follow',
    unfollow_button: 'Unfollow',
    display_name_placeholder: 'Edit your shop name',
    bio_placeholder: 'Edit your profile description',
    empty_state_title: 'Add your first product',
    empty_state_message_others: 'There no any items yet',
    empty_state_message_mine: `Get closer to your first sale by adding items
`,
    empty_state_button_mine: 'Make a Drop',
    notice_bar: 'Check your inbox for a confirmation email.',
    toast_saving: 'Loading...',
    toast_updated: 'Your profile has been updated',
    alert_unsaved_changes_title: 'Unsaved changes',
    alert_unsaved_changes_body: 'Are you sure you want to Cancel?',
    alert_unsaved_changes_button_cancel: 'NO',
    alert_unsaved_changes_button_confirm: 'YES',
    alert_report_title: 'Report User?',
    alert_block_title: 'Block user?',
    alert_block_subtitle:
      "They won't be able to find your profile or items. Onova won't let them know you blocked them",
    alert_block_success: 'User blocked',
    shop_tab: 'Shop',
    drops_tab: 'Drops',
  },
  chat_rooms: {
    header: 'Chats',
    error: 'Error fetching chats',
    empty_state_message: 'No chats found',
    my_message_prefix: 'You: ',
  },
  chat: {
    send_msg_placeholder: 'Type a message',
    no_orders: 'No orders',
  },
  checkout: {
    success_msg: "Super! We'll now alert the seller. The confirmation should arrive within __time__ hours".replace(
      '__time__',
      defaults.numHoursSellerHasToConfirm
    ),
    department_requirement_right: 'Pick a city',
    payment_button: 'Make Payment',
    save_card_info: 'Save card information',
    go_back: 'Go back',
    total_row: 'Total:',
    item_row: 'Item:',
    shipping_cost_row: 'Shipping cost:',
    missing: {
      cardNumber: 'Card CVC number',
      cardInfo: 'Card information',
      shippingAddress: 'Shipping address',
      mobileNumber: 'Mobile number',
    },
    error_is_missing: 'is missing',
    error_is_not_valid: 'is not valid',
    paragraph_1: [
      {
        p: 'Натискаючи на кнопку «Підтвердити покупку», ви погоджуєтесь з',
      },
      {
        p: 'умовами публічних договорів,',
        link: 'https://uapay.ua/ru/rules',
      },
      {
        p: 'умовами погодження на обробку персональних даних,',
        link: 'https://uapay.ua/ru/rules?anchor=userAgreement',
      },
      {
        p: 'умовами надання послуг логістичним партнером,',
        link: 'https://novaposhta.ua/uploads/misc/doc/Terms_of_Service.pdf',
      },
      {
        p:
          'публічним договором про надання послуг по організації перевезення відправлень,',
        link: 'https://novaposhta.ua/uploads/misc/doc/public_offer.pdf',
      },
      {
        p: 'а також приймаєте',
      },
      {
        p: 'Правила надання сервісу Безпечна покупка.',
        link: 'https://telegra.ph/Pravila-Bezpechnoi-ugodi-11-20',
      },
    ],
    paragraph_2:
      'Надання інформації про платіжну картку безпечне, Onova не зберігає ці дані. Зберігання та обробка відбувається на стороні нашого фінансового партнера, UAPAY, який пройшов аудит і отримав сертифікат PCI DSS 3.2, який гарантує повну безпеку ваших даних.',
  },
  userInfo: {
    firstName: "Ім'я",
    lastName: 'Прізвище',
    city: 'City',
    department: 'Novaposhta department',
    mobileNumber: '09712344569 Mobile number',
    shippingAddress: 'Shipping Address:',
    paymentInfo: 'Payment Info:',
  },
  notifications: {
    header: 'Notifications',
    load_more_button: 'Load more',
    empty_state_message: 'You do not have any notifications',
  },
  followers: {
    header: 'Followers',
    empty_state_message_title: 'No followers yet',
    empty_state_message_body: 'Somebody interesting is out there for sure',
  },
  following: {
    header: 'Following',
    empty_state_message_title: "This user doesn't have any followers",
    empty_state_message_body: 'Somebody interesting is out there for sure',
  },
  reviews: {
    header: 'Reviews',
    sold_tab: 'Sold',
    purchased_tab: 'Purchased',
    alert_info_title: 'Want more reviews?',
    alert_info_body:
      'To transfer your reviews from VK, Instagram, Facebook or other places, contact us at support@onova.co',
    empty_state_message:
      'To transfer your reviews from VK, Instagram, Facebook or other places, contact us at support@onova.co',
    completed: 'Successful transaction. No review left',
    cancelled: 'Seller cancelled the order',
    failed_by_buyer: 'Buyer failed to pick up or refused the item',
    failed_by_seller: "Seller failed to ship or didn't confirm on time",
  },
  settings: {
    header: 'Settings',
    username_label: 'Username:',
    username_placeholder: 'Edit your username',
    email_label: 'Email:',
    email_placeholder: 'Edit your email address (Requires re-verification)',
    password_label: 'Password:',
    password_placeholder: 'Password (minimum 8 characters)',
    sign_out_button: 'Sign out',
    alert_msg_email_address_changed:
      'The new email address requires to be valided. Please check your inbox',
    alert_msg_settigs_changed: 'Your settings have been updated',
    safe_purchase_rules: 'Onova safe purchase rules',
    faq: 'FAQ',
  },
  add_review: {
    header: 'Review',
    success_message: 'The review has been saved!',
    // nova_poshta_tracking_num: 'Nova Poshta tracking number',
    text_placeholder: 'Text (optional)',
    rating_error: 'Please select a rating',
    button: 'Leave a review',
    toast_msg_archived: 'This order is already archived',
    toast_msg_reviewed: 'You have already left a review',
    alert_confirm_archive: 'Are you sure you want to archive this order?',
    archived: 'Archived',
    tracking_num_label: 'Tracking num.',
  },
  order_status: {
    confirmed: 'Item is paid and confirmed',
    shipped: 'Item was shipped',
    not_shipped: 'Item is waiting to be shipped',
    not_collected: 'Item is waiting to be collected',
    collected: 'Item was collected',
    failed_to_collect: 'Buyer did not collect on time',
    failed_to_ship: 'Seller did not ship on time',
    updated: '(updated)',
  },
};
