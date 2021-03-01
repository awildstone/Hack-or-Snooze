"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */
function navAllStories(evt) {
  console.debug("navAllStories");
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */
function navLoginClick(evt) {
  console.debug("navLoginClick");
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */
function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  // $(".main-nav-links").show(); //doesn't do anything. I should add this class to my links I want to show
  $navLogin.hide();
  $navLogOut.show();
  $navSubmit.show(); //could add .main-nav-links to html element and remove this
  $navUserFavorite.show(); //could add .main-nav-links to html element and remove this
  $navUserStories.show(); //could add .main-nav-links to html element and remove this
  
  if (currentUser.username !== null) {
    $navUserProfile.text(`${currentUser.username}`).show();
  }
}

/* Handler for the "submit" link. Show the form to submit a new story. */
function navSubmitClick(evt) {
  console.debug("navSubmitClick");
  hidePageComponents();
  $storySubmitForm.show();
}
$navSubmit.on('click', navSubmitClick);

/* Handler for clicking the "favorites" link. Shows the current list of favorite stories for the current logged in user */
function showUserFavorites(evt) {
  console.debug("navUserFavorite");
  //hide other components and empty any user favorites
  hidePageComponents();
  //call function to make the list of user favorites
  putFavoritesListOnPage();
  $currentUserFavoritesList.show();
}
$navUserFavorite.on('click', showUserFavorites);

/* Handler for clicking the "my stories" link. Shows the current list of authored stories for the current logged in user */
function showUserStories(evt) {
  console.debug("navUserStories");
  //hide any page components
  hidePageComponents();
  //call function to make the list of user's stories
  putUserStoriesOnPage();
  $currentUserStoriesList.show();
}
$navUserStories.on('click', showUserStories);