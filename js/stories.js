"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  try {
    storyList = await StoryList.getStories();
    $storiesLoadingMsg.remove();
    putStoriesOnPage();
  } catch(err) {
    alert(`There was a problem getting the stories from the server: ${err}`)
  }
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  console.debug("generateStoryMarkup", story);
  const star = chooseStarType(currentUser, story);
  const deleteButton = '<i class="fas fa-trash-alt"></i>'
  //if there is a logged in user, show the favorites star
  const userLoggedIn = Boolean(currentUser);
  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
      ${userLoggedIn ? star : ""}
      ${showDeleteBtn ? deleteButton : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/* A function to choose the type of star to display for the current User & Story 
- currentUser is the current logged in user, Story is the current story to display
- return type of star to display
- returns null if there is no current logged in user
*/
function chooseStarType(currentUser, story) {
  const notFavoriteStar = '<i class="far fa-star" id="favorite"></i>';
  const favoriteStar = '<i class="fas fa-star" id="favorite"></i>';
  if (currentUser !== undefined) {
    if (currentUser.isFavoriteStory(story.storyId)) {
      return favoriteStar;
    } else {
      return notFavoriteStar;
    }
  }
}

/** Gets list of stories from server, generates their HTML, and puts on page. */
function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  //remove any current stories
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/* Submits a user's new story. 
- gets data from submit form, and clears inputs after use
- sends post request to API
- updates new list of stories on page from API
*/
async function submitNewStory(evt) {
  //prevent default behavior
  evt.preventDefault();

  //get form data
  let $author = $('#author-name').val();
  let $title = $('#story-title').val();
  let $url = $('#story-url').val();
  try {
    //add the Story
    await storyList.addStory(currentUser, {title: $title, author: $author, url: $url});

    //clear input values
    $('#author-name').val('');
    $('#story-title').val('');
    $('#story-url').val('');

    //hide form
    $storySubmitForm.hide();
    //show updated stories
    putStoriesOnPage();
  } catch(err) {
    alert(`There was a problem submitting the new story: ${err}`);
  }
}

$storySubmitForm.on('submit', submitNewStory);

/* Removes a user's story. 
- sends delete request to API
- removes the story from the stories, ownStories and favorites [] in local memory.
- updates list of stories on page from API
*/
async function removeUserStory(evt) {
  const storyId = evt.target.closest('li').id;
  console.log(storyId);
  try {
    //remove the story
    await storyList.removeStory(currentUser, storyId);

    //show updated stories
    hidePageComponents();
    putStoriesOnPage();
  } catch(err) {
    alert(`There was a problem removing the new story: ${err}`);
  }
}

$storiesList.on('click', '.fa-trash-alt', removeUserStory);

// toggle function will use the the User add/remove Favorite methods to update the API/data (send the story/id to the methods)
/* Toggles the user's favorite stories. 
- Uses the the User Add/Remove Favorite methods to update the API data.
- Updates the current user favorites []
- Updates the star (favorite) icon in the DOM.
*/
async function toggleFavorite(evt) {
  let $favStar = $(evt.target);
  let favoriteStoryID = evt.target.closest('li').id;
  let story = storyList.stories.find(s => s.storyId === favoriteStoryID);

  //check if this story id is already favorited by current user
  if (!(currentUser.isFavoriteStory(favoriteStoryID))) {
    try {
      //if the story is not in the current user favorites[], add favorite to API and user favorites[]
      await currentUser.addFavoriteStory(story);
      //update favorite star in DOM
      $favStar.attr('class', 'fas fa-star');
    } catch(err) {
      alert(`There was a problem adding this favorite: ${err}`)
    }
  } else {
    try {
      //if the story is in the current user favorites[], remove favorite from API and user favorites[]
      await currentUser.removeFavoriteStory(story);
      //update favorite star in DOM
      $favStar.attr('class','far fa-star');
    } catch(err) {
      alert(`There was a problem removing this favorite: ${err}`)
    }
  }
}

$storiesList.on('click', '.fa-star', toggleFavorite);

/* Builds a list of the current user's stories, generates the HTML markup for the list. */
function putUserStoriesOnPage() {
  //empty any existing stories
  $currentUserStoriesList.empty();
  //if there are no user stories yet, display this message on the page
  if (currentUser.ownStories.length === 0) {
    $currentUserStoriesList.append("<p>There are no stories for this user yet.</p>");
  } else {
    // loop through all of the user's stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      //true is flag to show the delete button
      const $story = generateStoryMarkup(story, true);
      $currentUserStoriesList.append($story);
    }
  }
}

/* Builds a list of the current user's favorite stories, generates the HTML markup for the list. */
function putFavoritesListOnPage() {
  //empty any existing favorites lists
  $currentUserFavoritesList.empty();
  //if there are no user favorites yet, display message
  if (currentUser.favorites.length === 0) {
    $currentUserFavoritesList.append("<p>There are no favorites for this user yet.</p>");
  } else {
    // loop through all of the user's favories and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $currentUserFavoritesList.append($story);
    }
  }
}