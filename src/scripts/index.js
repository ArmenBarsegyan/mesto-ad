import {getUserInfo, getCardList, setUserInfo, setUserAvatar, addNewCard, deleteCardApi, changeLikeCardStatus } from "./components/api.js";
import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

const validationConfig = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationConfig);

const placesList = document.querySelector(".places__list");
const profilePopup = document.querySelector(".popup_type_edit");
const cardPopup = document.querySelector(".popup_type_new-card");
const avatarPopup = document.querySelector(".popup_type_edit-avatar");
const imagePopup = document.querySelector(".popup_type_image");
const deletePopup = document.querySelector(".popup_type_remove-card");
const infoPopup = document.querySelector(".popup_type_info");

const profileForm = profilePopup.querySelector(".popup__form");
const nameInput = profileForm.querySelector(".popup__input_type_name");
const descriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardForm = cardPopup.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const avatarForm = avatarPopup.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const deleteForm = deletePopup.querySelector(".popup__form");

const popupImage = imagePopup.querySelector(".popup__image");
const popupCaption = imagePopup.querySelector(".popup__caption");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

let currentUserId = '';
let cardToDelete = null;
let cardElementToDelete = null;

const renderLoading = (button, isLoading, defaultText, loadingText) => {
  if (isLoading) {
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = defaultText;
    button.disabled = false;
  }
};

const showImage = ({ name, link }) => {
  popupImage.src = link;
  popupImage.alt = name;
  popupCaption.textContent = name;
  openModalWindow(imagePopup);
};

const handleLikeClick = (cardId, likeButton, likesCountElement) => {
  const isLiked = likeButton.classList.contains('card__like-button_is-active');
  
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      if (isLiked) {
        likeButton.classList.remove('card__like-button_is-active');
      } else {
        likeButton.classList.add('card__like-button_is-active');
      }
      
      if (likesCountElement) {
        likesCountElement.textContent = updatedCard.likes.length;
      }
    })
    .catch((err) => {
      console.log('Ошибка при изменении лайка:', err);
    });
};

const handleDeleteClick = (cardId, cardElement) => {
  cardToDelete = cardId;
  cardElementToDelete = cardElement;
  openModalWindow(deletePopup);
};

const calculateCardStatistics = (cards) => {
  const uniqueUsers = new Set();
  let totalLikes = 0;
  let maxLikesFromSingleUser = 0;
  let champion = null;
  const userLikes = {};
  
  cards.forEach(card => {
    if (card.owner && card.owner._id) {
      uniqueUsers.add(card.owner._id);
    }
    
    totalLikes += card.likes.length;
    
    card.likes.forEach(user => {
      uniqueUsers.add(user._id);
      
      if (!userLikes[user._id]) {
        userLikes[user._id] = {
          user: user,
          likesCount: 0
        };
      }
      userLikes[user._id].likesCount++;
      
      if (userLikes[user._id].likesCount > maxLikesFromSingleUser) {
        maxLikesFromSingleUser = userLikes[user._id].likesCount;
        champion = user;
      }
    });
  });
  
  const popularCards = [...cards]
    .sort((a, b) => b.likes.length - a.likes.length)
    .slice(0, 3);
  
  return {
    totalUsers: uniqueUsers.size,
    totalLikes: totalLikes,
    maxLikesFromSingleUser: maxLikesFromSingleUser,
    champion: champion,
    popularCards: popularCards
  };
};

const handleLogoClick = () => {
  Promise.all([getUserInfo(), getCardList()])
    .then(([userData, cards]) => {
      const stats = calculateCardStatistics(cards);
      
      const usersElement = infoPopup.querySelector('.popup__info-description_users');
      const likesElement = infoPopup.querySelector('.popup__info-description_likes');
      const maxLikesElement = infoPopup.querySelector('.popup__info-description_max-likes');
      const championElement = infoPopup.querySelector('.popup__info-description_champion');
      const popularCardsContainer = infoPopup.querySelector('.popup__cards-container');
      
      if (usersElement) usersElement.textContent = stats.totalUsers;
      if (likesElement) likesElement.textContent = stats.totalLikes;
      if (maxLikesElement) maxLikesElement.textContent = stats.maxLikesFromSingleUser;
      
      if (championElement && stats.champion) {
        championElement.textContent = stats.champion.name || 'Неизвестный пользователь';
      } else if (championElement) {
        championElement.textContent = 'Нет чемпиона';
      }
      
           if (popularCardsContainer) {
        popularCardsContainer.innerHTML = '';
        
        popularCardsContainer.style.display = 'inline';
        
        const template = document.getElementById('popular-card-template');
        
        stats.popularCards.forEach((card, index) => {
          const cardElement = template.content.cloneNode(true);
          const popularCardText = cardElement.querySelector('.popup__popular-card-text');
          
          popularCardText.textContent = card.name + '\u00A0\u00A0'; // два неразрывных пробела
          
          popularCardsContainer.appendChild(cardElement);
        });
        
        // Если карточек нет, показываем сообщение
        if (stats.popularCards.length === 0) {
          const noCardsText = document.createElement('span');
          noCardsText.classList.add('popup__popular-card-text');
          noCardsText.textContent = 'Нет популярных карточек';
          popularCardsContainer.appendChild(noCardsText);
        }
      }
      
      openModalWindow(infoPopup);
    })
    .catch((err) => {
      console.log('Ошибка при загрузке статистики:', err);
    });
};

profileForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  
  const submitButton = profileForm.querySelector('.popup__button');
  const defaultText = submitButton.dataset.defaultText || 'Сохранить';
  const loadingText = submitButton.dataset.loadingText || 'Сохранение...';
  
  renderLoading(submitButton, true, defaultText, loadingText);
  
  setUserInfo({
    name: nameInput.value,
    about: descriptionInput.value
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profilePopup);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, defaultText, loadingText);
    });
});

avatarForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  
  const submitButton = avatarForm.querySelector('.popup__button');
  const defaultText = submitButton.dataset.defaultText || 'Сохранить';
  const loadingText = submitButton.dataset.loadingText || 'Сохранение...';
  
  renderLoading(submitButton, true, defaultText, loadingText);
  
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarPopup);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, defaultText, loadingText);
    });
});

cardForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  
  const submitButton = cardForm.querySelector('.popup__button');
  const defaultText = submitButton.dataset.defaultText || 'Создать';
  const loadingText = submitButton.dataset.loadingText || 'Создание...';
  
  renderLoading(submitButton, true, defaultText, loadingText);
  
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value
  })
    .then((newCard) => {
      const cardElement = createCardElement(
        newCard,
        {
          onPreviewPicture: showImage,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick
        },
        currentUserId
      );
      placesList.prepend(cardElement);
      cardForm.reset();
      closeModalWindow(cardPopup);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, defaultText, loadingText);
    });
});

deleteForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  
  const submitButton = deleteForm.querySelector('.popup__button');
  const defaultText = submitButton.dataset.defaultText || 'Да';
  const loadingText = submitButton.dataset.loadingText || 'Удаление...';
  
  renderLoading(submitButton, true, defaultText, loadingText);
  
  deleteCardApi(cardToDelete)
    .then(() => {
      cardElementToDelete.remove();
      closeModalWindow(deletePopup);
    })
    .catch((err) => {
      console.log('Ошибка при удалении:', err);
    })
    .finally(() => {
      renderLoading(submitButton, false, defaultText, loadingText);
      cardToDelete = null;
      cardElementToDelete = null;
    });
});

document.querySelector(".profile__edit-button").addEventListener("click", () => {
  nameInput.value = profileTitle.textContent;
  descriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationConfig);
  openModalWindow(profilePopup);
});

document.querySelector(".profile__add-button").addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationConfig);
  openModalWindow(cardPopup);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationConfig);
  openModalWindow(avatarPopup);
});

document.querySelector('.header__logo').addEventListener('click', handleLogoClick);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    
    cards.forEach((cardData) => {
      placesList.append(
        createCardElement(
          cardData,
          {
            onPreviewPicture: showImage,
            onLikeIcon: handleLikeClick,
            onDeleteCard: handleDeleteClick
          },
          currentUserId
        )
      );
    });
  })
  .catch((err) => {
    console.log('Ошибка при загрузке данных:', err);
  });

document.querySelectorAll(".popup").forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});