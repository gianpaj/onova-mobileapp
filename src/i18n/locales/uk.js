import defaults from '../../utils/defaults';
import settings from '../../config/settings';

export default {
  intro: {
    skip: 'Пропустити',
    next: 'Наступний',
    step_1: {
      title: 'БЕЗПЕЧНА КУПІВЛЯ',
      subtitle: `Купуй речі з захищеною системою від UAPAY™



 `,
    },
    step_2: {
      title: 'ПРОДАВАЙ ЛЕГКО',
      subtitle: `Створи професійну сторінку продавця менш ніж за хвилину


 `,
    },
    step_3: {
      title: 'ДОДАВАЙ ІНШИХ',
      subtitle: `Чим більше людей ти додаєш, тим більше речей ти бачиш на домашній сторінці


 `,
    },
  },
  sign_up_login_tabs: {
    signup: 'Реєстрація',
    login: 'Вхід',
  },
  signup: {
    username_placeholder: 'Username',
    email_placeholder: 'Email',
    password_placeholder: 'Password (мін 8 знаків)',
    sign_up_button: 'Створити профіль',
    terms_text_1: 'Натискаючи зареєструватись ви погоджуєтесь з',
    terms_text_2: 'Політикою Конфіденційності,',
    terms_text_3: 'Умовами надання послуг,',
    terms_text_4: 'Умовами Безпечної угоди',
    alerts: {
      username_too_short: "Будь ласка введіть довше ім'я (мін 3 знаків)",
      username_too_long: "будь ласка введіть коротше ім'я",
      username_invalid:
        "Будь ласка введіть правильне ім'я (лише літери, цифри та _ .)",
      email_invalid: 'Електронна адреса не дійсна',
      password_too_short: 'Будь ласка введіть довший пароль (мін 8 знаків)',
      password_too_long: 'Будь ласка введіть коротший пароль',
    },
  },
  login: {
    email_placeholder: 'Email',
    password_placeholder: 'Password',
    log_in_button: 'Увійти',
    forgot_password: 'Забув пароль?',
    reset_password: {
      title: 'Якісь проблеми з входом?',
      info: 'Введіть ваш email для зміни паролю',
      button: 'Надіслати інструкції по зміні',
    },
    verify_account: {
      title: 'Ми надіслали вам підтвердження на пошту!',
    },
    retry: 'Спробуй ще раз',
  },
  home: {
    clothes_tab: 'Одяг',
    shoes_tab: 'Взуття',
    other_tab: 'Інше',
    share:
      'Android: https://play.google.com/store/apps/details?id=com.onova.app&hl=uk - Apple Store: https://itunes.apple.com/ua/app/onova/id1365771422?mt=8',
    alert_info_title: 'Підтримка',
    alert_info_body: `З будь якими питаннями щодо додатку телефонуйте до Onova
(063) 419-75-03

З будь якими питаннями щодо платежів телефонуйте до UAPAY (044) 364-11-44`,
  },
  image_grid: {
    error: 'Помилка завантаження інформації оголошення',
    empty_state_title: 'Ще немає речей для перегляду',
    empty_state_body:
      'Додавай інших користувачів в друзі щоб бачити що вони виставляють',
    empty_state_button: 'Знайти',
  },
  image_grid_search: {
    empty_state_title: 'Ми не знайшли нічого подібного',
    empty_state_body: 'Спробуй пошукати щось інше',
  },
  product: {
    buy_button: 'Придбати',
    reserved_button: 'Зарезервовано',
    reserved_message: 'Перевір через 15хв, товар може бути доступний',
    alert_confirm_delete: 'Точно видалити?',
    toast_warning_on_unverified_account: 'Підтвердіть ваш профіль в email...',
    toast_warning_on_product_sold: 'Цю річ вже продано',
    toast_warning_ok_button: 'ОК',
    alert_report_title: 'Поскаржитись на річ?',
    share_before: 'Запроси двох друзів щоб почати купувати на Онові',
  },
  comments: {
    add_comment_placeholder: 'Прокоментувати',
    alert_confirm_deletion: 'Точно Видалити?',
    toast_warning_mention_not_found: 'Користувача не знайдено',
    toast_warning_on_unverified_account:
      'Підтвердіть свій профіль щоб коментувати',
  },
  alerts: {
    email_error: 'Цей email не зареєстровано',
    password_error: 'Неправильний пароль',
    loading_message: 'Хвилинку...',
    network_error: 'Проблема з інтернетом',
    confirm_alert_button_cancel: 'відміна',
    confirm_alert_button_confirm: 'OK',
    report_subtitle: "Напишіть причину (обов'язково)",
    report_error: 'Мінімально 7 знаків',
    report_success: 'Дякую, що допомагаєте нам відсіювати поганих користувачів',
    action_button_close: 'Закрити',
    action_button_block: 'Блокувати',
    action_button_cancel: 'Скасувати',
    action_button_delete: 'Видалити',
    action_button_edit: 'Редагувати',
    action_button_report: 'Поскаржитись',
    toast_uploading: 'Завантажуємо зображення...',
    notice_bar_account_verification:
      'Check your inbox for a confirmation email',
    notice_bar_location_not_gathered:
      "Couldn't gather you location. It's needed to display the item city",
    notice_bar_location_not_gathered_button: 'Retry',
  },
  search: {
    header: 'Пошук',
    tags_tab: '#Теги',
    shops_tab: '@Користувачі',
    empty_state_message: 'Немає таких',
    error: 'Помилка під час пошуку',
    hashtag_placeholder: 'hashtag',
    search_button: 'Знайти',
    username_placeholder: 'username',
  },
  categories: {
    clothes: 'Одяг',
    shoes: 'Взуття',
    other_cat: 'Інше',
    men: 'Чоловіче',
    women: 'Жіноче',
    other_type: 'Інше',
  },
  add_or_edit_item: {
    add_item_header: 'Додати',
    cropper_toolbar_title: 'Кадрування',
    cropper_choose_text: 'Погодити',
    cropper_cancel_text: 'Відмінити',
    image_processing: 'Фотографії завантажуються',
    edit_item_header: 'Редагувати',
    price_label: 'Ціна:',
    price_placeholder: `${settings.MIN_PRICE} ГРН`,
    price_info: 'Комісія',
    price_popup_title: 'Комісія',
    price_popup_body: `Коли якусь річ успішно продано, UAPAY автоматично знімає від загальної вартості комісію, решта надходить на ваш рахунок.

10%+10 грн для товарів вартістю менше ніж 1000 грн.

5%+10 грн для товарів вартістю більше ніж 1000 грн.`,
    description_label: 'Опис:',
    description_placeholder:
      'В якому стані річ, якого розміру, бренду і тому подібне',
    hashtags_label: '#tags:',
    hashtags_placeholder: 'adidas, 43',
    select_photo_source_camera: 'Камера',
    select_photo_source_gallery_ios: 'Фотоплівка (група зображень)',
    select_photo_source_gallery_android: 'Галерея (група зображень)',
    select_photo_source_cancel: 'Відмінити',
    too_many_images: 'Дозвелоно максимум 6 зображень',
    image_too_small:
      'Зображення низької якості. Мінімальна ширина та висота {{MIN_WIDTH}} px. Надане зображення {{width}}x{{height}} px',
    min_price: 'Мінімальна ціна Х',
    info_popup: `Чим якісніші твої фотографії тим більше ймовірності в тебе щось придбають:

1. Фон
Якщо є білий фон, використовуй його - згідно багатьох досліджень, білий фон збільшує продажі на 40%

2. Розташування товару
Слідкуй щоб весь товар влізав в квадрат зображення і роби фото з різних сторін товару

3. Став свій тег
Якщо хочеш додаткової довіри з боку покупця - просто напиши десь на листочку і постав свій @username в фото.

З галереї можна обирати кілька фотографій одразу для завантаження`,
  },
  create_drop: {
    title: 'Створити Дроп',
    ok: 'OK',
    cancel: 'Скасувати',
    select: 'Оберіть час завантаження Дропу',
    success: 'Ваш дроп успішно заплановано!',
    permission_title: 'Доступ до місцезнаходження',
    permission_message: 'Нам потрібно відображати де знаходяться речі.',
    permission_alert_button_settings: 'Відкрити налаштування',
    cannot_create_drop_alert:
      'Додай в Налаштуваннях свою поштову інформації та куди мають надходити кошти',
  },
  confirm_order: {
    header: 'Підтвердити замовлення',
    confirm: 'Підтвердити',
    buying_item_text: 'Хоче придбати твою річ',
    button_cancel_order: 'Скасувати замовлення',
    dialog_title: 'Ти впевнений що хочеш скасувати замовлення?',
    reason_placeholder: 'Напиши чому ти скасовуєш замовлення',
    error_reason_is_mandatory: 'Будь ласка вкажи причину',
  },
  drops_grid: {
    empty_state_title: 'Створити дроп',
    empty_state_message_mine:
      'Завантаж кілька речей для одночасного виставлення у вказаний час',
    empty_state_button_mine: 'Створити дроп',
    empty_state_message_others: 'Жодних запланованих Дропів',
  },
  profile: {
    reviews_label: 'відгуки',
    followers_label: 'Клієнти',
    following_label: 'Магазини',
    edit_profile_button: 'Редагувати профіль',
    save_profile_button: 'Зберегти',
    follow_button: 'додати',
    unfollow_button: 'видалити',
    display_name_placeholder: 'Назва твого профілю',
    bio_placeholder: 'Опис твого профілю',
    empty_state_title: 'Немає речей на продаж',
    empty_state_message_others: 'Поки нічого не виставлено',
    empty_state_message_mine: 'Ти ще нічого не виставив ',
    empty_state_button_mine: 'Створити дроп',
    toast_saving: 'Зберігаємо...',
    toast_updated: 'Твій профіль оновлено',
    alert_unsaved_changes_title: 'Незбережені зміни',
    alert_unsaved_changes_body: 'Не зберігати зміни?',
    alert_unsaved_changes_button_cancel: 'Ні',
    alert_unsaved_changes_button_confirm: 'Так',
    alert_report_title: ' Поскаржитись на користувача?',
    alert_block_title: 'Заблокувати користувача?',
    alert_block_subtitle:
      'Тепер ви не будете бачити речей цього користувача, він не буде бачити ваших',
    alert_block_success: 'User blocked',
    shop_tab: 'Магазин',
    drops_tab: 'Дропи',
  },
  chat_rooms: {
    header: 'Чати',
    error: 'Помилка завантаження чатів',
    empty_state_message: 'Немає замовлень',
    my_message_prefix: 'Ти: ',
  },
  chat: {
    send_msg_placeholder: 'Повідомлення',
    no_orders: 'Немає замовлень',
  },
  checkout: {
    success_msg: 'Ми надіслали замовлення продавцеві, чекай на підтвердження протягом __time__ годин'.replace(
      '__time__',
      defaults.numHoursSellerHasToConfirm
    ),
    department_requirement_right: 'Обери місто',
    payment_button: 'Придбати',
    save_card_info: 'Зберегти данні картки',
    go_back: 'Назад',
    total_row: 'Загалом:',
    item_row: 'Річ:',
    shipping_cost_row: 'Вартість доставки:',
    location: 'місцезнаходження',
    ukraine: 'Україна',
    missing: {
      cardNumber: 'CVC номер',
      cardInfo: 'Данні картки',
      shippingAddress: 'Адреса доставки',
      mobileNumber: 'Мобільний телефон',
    },
    error_is_missing: 'відсутній',
    error_is_not_valid: 'недійсний',
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
    city: 'Місто',
    department: 'Відділення Нової Пошти',
    mobileNumber: '09712344569 Мобільний телефон',
    shippingAddress: 'Адреса доставки:',
    paymentInfo: 'Налаштування оплати:',
  },
  notifications: {
    header: 'Сповіщення',
    load_more_button: 'Ще',
    empty_state_message: 'Жодних сповіщень',
  },
  followers: {
    header: 'Контакти',
    empty_state_message_title: 'Жодних доданих користувачів',
    empty_state_message_body: 'Хтось тобі по смаку десь там є точно - пошукай',
  },
  following: {
    header: 'Магазини',
    empty_state_message_title: 'У цього користувача немає контактів',
    empty_state_message_body: 'Хтось тобі по смаку десь там є точно - пошукай',
  },
  reviews: {
    header: 'Відгуки',
    sold_tab: 'Продано',
    purchased_tab: 'Куплено',
    alert_info_title: 'Потрібно більше відгуків?',
    alert_info_body:
      'Щоб перенести свої відгуки з VK, Instagram, Facebook або іншого місця напиши нам на support@onova.co',
    empty_state_message:
      'Щоб перенести свої відгуки з VK, Instagram, Facebook або іншого місця напиши нам на support@onova.co',
    completed: 'Успішна покупка без відгуку',
    cancelled: 'Продавець відмінив покупку',
    failed_by_buyer: 'Покупець не забрав покупку',
    failed_by_seller: 'Продавець відмінив або не відправив товар',
  },
  settings: {
    header: 'Налаштування',
    username_label: 'Username:',
    username_placeholder: 'Редагувати username',
    email_label: 'Email:',
    email_placeholder: 'Змінити email (Потрібно буде підтвердити)',
    password_label: 'Пароль:',
    password_placeholder: 'Password (minimum 8 characters)',
    sign_out_button: 'Вийти',
    alert_msg_email_address_changed:
      'Новий email має бути підтверджено. Ми надіслали інструкції',
    alert_msg_settigs_changed: 'Зміни збережено',
    safe_purchase_rules: 'Правила Безпечної угоди',
    faq: 'Поширені запитання',
  },
  add_review: {
    header: 'Відгук',
    success_message: 'Відгук залишено!',
    // nova_poshta_tracking_num: 'Номер накладної Нової Пошти',
    text_placeholder: "Текст (не обов'язково)",
    rating_error: 'Обери якість від 1 до 5',
    button: 'Залишити відгук',
    toast_msg_archived: 'Ти вже видалив це замовлення',
    toast_msg_reviewed: 'Ти вже залишив відгук',
    alert_confirm_archive: 'Видалити?',
    archived: 'Переміщено в Архів',
    tracking_num_label: 'Накладна',
  },
  order_status: {
    confirmed: 'Сплачено покупцем',
    shipped: 'Відправлено продавцем',
    not_shipped: 'Чекає відправлення продавцем',
    not_collected: 'Відправлення прибуло, чекає покупця',
    collected: 'Отримано покупцем',
    failed_to_collect: 'Покупець не забрав пакунок',
    failed_to_ship: 'Продавець не відправив пакунок',
    updated: '(Оновлено)',
  },
};
