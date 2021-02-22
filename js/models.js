"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    let hostname = new URL(this.url).hostname;
    return hostname;
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    //We would only want one shared instance of the StoryList accessible from the StoryList Class. If each instance of a Story had its own list of stories, other Story instances would not be aware of those other StoryList instances or any changes to those instances. Other objects that interact with StoryList like users could not share the same StoryList instance if we allowed multiple instances.

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */
  async addStory(user, newStory) {
    //post new story to API, save API response
    const res = await axios.post(`${BASE_URL}/stories`, {
      'token': user.loginToken,
      'story': {
        'author': newStory.author,
        'title': newStory.title,
        'url': newStory.url
      }
    });

    //create new Story instance
    const newStoryInstance = new Story(res.data.story);
    console.debug(newStoryInstance);

    //add new Story to our StoryList
    this.stories.unshift(newStoryInstance);
    //update current user's storylist
    user.ownStories.unshift(newStoryInstance);

    return newStoryInstance;
  }

    /** Removes a user's story from the API and memory arrays for the current user.
   * User - the current user and author of the story.
   * storyId - the current user's story to remove.
   */
  async removeStory(user, storyId) {
    //send delete request to API, save API response
    const token = user.loginToken;
    const res = await axios.delete(`${BASE_URL}/stories/${storyId}`, {params: { token }});
    console.debug(res.data.message);

    //if the API call is successful, remove the story from stories []
    this.stories = this.stories.filter(s => s.storyId !== storyId);

    //remove the story from the current user stories[] and favorites[]
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
    user.favorites = user.favorites.filter(s => s.storyId !== storyId);
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** addFavoriteStory sends a post request to the API to add the current user's favorite story.
   * If the request is successful, it updates the current user favorites[].
   * * If the request fails, an error is thrown.
   */
  async addFavoriteStory(story) {
    //add this story to user API of thisuser favorites
    //successfull response should return a user obj with array of updated favorites
    const res = await axios.post(`${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, 
    {'token': this.loginToken});
    console.debug(res.data.message);
    const requestStatus = res.status;
    //if API call doesn't fail add this current user favorite []
     if (requestStatus === 200) {
      this.favorites.push(story);
     } else {
       console.warn('The request to add Favorite FAILED', story);
     }
  }

   /** removeFavoriteStory sends a delete request to the API to delete the current user's favorite story.
   * If the request is successful, it updates the current user favorites[].
   * If the request fails, an error is thrown.
   */
  async removeFavoriteStory(story) {
    //send delete request to delete this user favorite
    //successfull response should return a user obj with array of updated favorites
    const token = this.loginToken;
    const res = await axios.delete(`${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, {params: { token }});
    console.debug(res.data.message);
    const requestStatus = res.status;
    //saving the response - I might want to return something from the User Obj
    //if API call doesn't fail
     //update our favorites[] with all favorites that do not match the favorite to remove
     if (requestStatus === 200) {
      this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);
     } else {
       console.warn('The request to delete Favorite FAILED', story);
     }
  }

  /* isFavoriteStory checks the current user favorites[] for the storyId and returns true or false if the story is in the current favorites [] */
  isFavoriteStory(storyId) {
    const isFavorite = this.favorites.some(s => s.storyId === storyId);
    // console.log(`Curr Story: ${storyId}, in favorites? ${isFavorite}`);
    return isFavorite;
  }

}
