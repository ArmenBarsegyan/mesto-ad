const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  cardData,
  { onPreviewPicture, onLikeIcon, onDeleteCard },
  currentUserId
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector('.card__like-button');
  const deleteButton = cardElement.querySelector('.card__control-button_type_delete');
  const cardImage = cardElement.querySelector('.card__image');
  
  const likesCountElement = cardElement.querySelector('.card__likes-count');

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardElement.querySelector('.card__title').textContent = cardData.name;
  
  if (likesCountElement && cardData.likes) {
    likesCountElement.textContent = cardData.likes.length;
  }
  
  const isOwn = cardData.owner && cardData.owner._id === currentUserId;
  if (!isOwn && deleteButton) {
    deleteButton.style.display = 'none';
  }
  
  const isLiked = cardData.likes && cardData.likes.some(like => like._id === currentUserId);
  if (isLiked && likeButton) {
    likeButton.classList.add('card__like-button_is-active');
  }

  if (cardData._id) {
    cardElement.dataset.cardId = cardData._id;
  }

  if (onLikeIcon && likeButton && likesCountElement) {
    likeButton.addEventListener('click', () => onLikeIcon(cardData._id, likeButton, likesCountElement));
  }

  if (onDeleteCard && isOwn && deleteButton) {
    deleteButton.addEventListener('click', () => onDeleteCard(cardData._id, cardElement));
  }

  if (onPreviewPicture && cardImage) {
    cardImage.addEventListener('click', () => onPreviewPicture({ 
      name: cardData.name, 
      link: cardData.link 
    }));
  }

  return cardElement;
};

export const likeCard = (likeButton) => {
  likeButton.classList.toggle("card__like-button_is-active");
};

export const deleteCard = (cardElement) => {
  cardElement.remove();
};