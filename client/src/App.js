import React, { Component } from 'react';
import axios from 'axios';
import * as firebase from 'firebase';

import {
  BrowserRouter as Router,
  Route,
  Redirect,
} from 'react-router-dom'

import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';


class App extends Component {
  constructor() {
    super();

    this.state = {
      auth: false,
      cardData: null,
      cardDataLoaded: false,
      userCardData: null,
      newCardData: false,
      user: null,
      currentPage: 'dashboard',
      currentCardId: null,
      currentUserId: null,
      redirect: '/',
      currentContent: 'user-cards', 
      users: {1: 0, 2: 0, 3: 0},
      players: {1: 0, 2: 0, 3: 0},      
    }

    // configure firebase
    const config = {
      apiKey: "AIzaSyBeWljzW5mON5qnOPJ5_BEnuj79_kSG4mA",
      authDomain: "grandmaster-71126.firebaseapp.com",
      databaseURL: "https://grandmaster-71126.firebaseio.com",
      projectId: "grandmaster-71126",
      storageBucket: "",
      messagingSenderId: "760258177615"
    };

    // initialize firebase
    firebase.initializeApp(config);

    // set firebase references
    this.rootRef = firebase.database().ref();
    this.lobbyRef = this.rootRef.child('lobby');

  }

  componentDidMount() {
    // gets all of the cards in the api to display in Card Collection
    axios.get('/cards')
      .then(res => {
        console.log(res.data)
        this.setState({
          cardData: res.data,
          cardDataLoaded: true,
        });
      }).catch(err => 
        console.log(err));

    // redirect if not logged in
    this.requireLogin();

    // set up listeners for firebase to get current players/users in game rooms
    this.lobbyRef.on('child_added', type => {
      let updatedInfo = {};

      this.lobbyRef.child(type.key).on('child_added', room => {
        updatedInfo[room.key] = room.node_.value_;
      });

      this.setState({
        [type.key]: updatedInfo,
      });
    })

    // set up listener for firebase for when players/users enter leave game rooms
    this.lobbyRef.on('child_changed', type => {
      let updatedInfo = {};

      this.lobbyRef.child(type.key).on('child_added', room => {
        updatedInfo[room.key] = room.node_.value_;
      });
      
      this.setState({
        [type.key]: updatedInfo,
      });
    })
  }

  // redirects user to login screen if not logged in
  requireLogin = () => {
    if(!this.state.auth) {
      this.setState({
        redirect: '/login',
      });
    } else {
      this.setState({
        redirect: '/user',
      })
    }
  };

  // logs user in, gets users cards, redirects to their dashboard
  handleLoginSubmit = (e, username, password) => {
    e.preventDefault();
    axios.post('/auth/login', {
      username,
      password,
    }).then(res => {
      this.setState({
        auth: res.data.auth,
        user: res.data.user,
      });
    }).then(() => {
      if(this.state.user) {
        this.getUserCards();
        this.setState({
          redirect: '/user',
        })
      }
    }).catch(err => 
      console.log(err));
  }

  // get user's cards from database
  getUserCards = () => {
    axios.get('/usercard')
    .then(res => {
      // console.log(res.data)
      this.setState({
        userCardData: res.data,
      })
    })
    .catch(err => {
      console.log(err);
    })
  }

  // when user first logs in, gives them their initial 10 random cards
  getInitialUserCards = () => {
    axios.get('/user/new')
    .then(res => {
      // console.log(res.data)
      this.setState({
        userCardData: res.data,
      })
    })
    .then(() => {
      this.state.userCardData.forEach(data => {
        axios.post('/usercard/new', {
          cardId: data.id,
          name: data.name,
          class: data.class,
          attack: data.attack,
          defense: data.defense,
          imageUrl: data.image_url,
        })
        .then(res => {
          // console.log(res)
        })
        .catch(err => {
          console.log(err)
        })
      })
    })
    .catch(err => {
        console.log(err);
    })
  }

  // gets a random card when users requests a new card, adds it to their cards
  getNewUserCard = () => {
    if (this.state.user.currency >= 20){
      axios.get('/cards/new')
      .then(res => {
        // console.log(res.data)
        this.setState({
          newCardData: res.data,
        })
      })
      .then(() => {
        axios.post('/usercard/new', {           
          cardId: this.state.newCardData[0].id,
          name: this.state.newCardData[0].name,
          class: this.state.newCardData[0].class,
          attack: this.state.newCardData[0].attack,
          defense: this.state.newCardData[0].defense,
          imageUrl: this.state.newCardData[0].image_url
          })
          .then(res => {
            this.getUserCards();
          })
          .catch(err => {
            console.log(err)
          })
      })
      .then(() => {
        let updatedCurrency = this.state.user.currency
        updatedCurrency -= 20
        this.setState({
          user: {
            currency: updatedCurrency,
            display_name: this.state.user.display_name,
            email: this.state.user.email,
            id: this.state.user.id,
            password_digest: this.state.user.password_digest,
            username: this.state.user.username,
            wins: this.state.user.wins,
          }
        })
      })
      .then(() => {
        axios.put(`/user/win`, {
          username: this.state.user.username,
          wins: this.state.user.wins,
          currency: this.state.user.currency,
        }).then(res => {
          console.log(res);
        }).catch(err => {
          console.log(err);
        })
      })
      .catch(err => {
          console.log(err);
      })
    }else if(this.state.user.currency < 20){
      alert('Oops, not enough money. Win a few battles and come back!')
    }
  }

  getNewUserCardPremium = (num) => {
    if (this.state.user.currency >= num*2){
      axios.get(`/cards/new/${num}`)
      .then(res => {
        // console.log(res.data)
        this.setState({
          newCardData: res.data,
        })
      })
      .then(() => {
        axios.post('/usercard/new', {           
          cardId: this.state.newCardData[0].id,
          name: this.state.newCardData[0].name,
          class: this.state.newCardData[0].class,
          attack: this.state.newCardData[0].attack,
          defense: this.state.newCardData[0].defense,
          imageUrl: this.state.newCardData[0].image_url
          })
          .then(res => {
            this.getUserCards();
          })
          .catch(err => {
            console.log(err)
          })
      })
      .then(() => {
        let updatedCurrency = this.state.user.currency
        updatedCurrency -= num*2
        this.setState({
          user: {
            currency: updatedCurrency,
            display_name: this.state.user.display_name,
            email: this.state.user.email,
            id: this.state.user.id,
            password_digest: this.state.user.password_digest,
            username: this.state.user.username,
            wins: this.state.user.wins,
          }
        })
      })
      .then(() => {
        axios.put(`/user/win`, {
          username: this.state.user.username,
          wins: this.state.user.wins,
          currency: this.state.user.currency,
        }).then(res => {
          console.log(res);
        }).catch(err => {
          console.log(err);
        })
      })
      .catch(err => {
          console.log(err);
      })
    }else if(this.state.user.currency < num*2){
      alert('Oops, not enough money. Win a few battles and come back!')
    }
  }

  // deletes a user's card after they confirm it
  deleteUserCard = (id) => {
    let confirm = window.confirm(`${this.state.user.username}, are you sure you want to delete this card?`);
    if(confirm === true) {
      axios.delete(`/usercard/${id}`)
      .then((res) => {
        const updatedCards = [...this.state.userCardData];
        let deletedIndex;

        updatedCards.forEach((card, index) => {
          if (card.id === id) {
            deletedIndex = index;
          };
        });

        updatedCards.splice(deletedIndex, 1);

        this.setState({
          userCardData: updatedCards,
        });

      }).catch(err => {
        console.log(err);
      });
    }
  }

  // sets the redirect page when called
  setRedirect = () => {
    this.setState({
      redirect: null,
    })
  }

  // sets the current page for the 'Join Game/User Dashboard' display
  setCurrentPage = (page) => {
    this.setState({
      currentPage: page,
    });
  }

  // sets the dashboard content to display
  setContent = (page) => {
    this.setState({
      currentContent: page,
    });
  }

  // deletes a user's account after getting confirmation
  deleteUser = (id) => {
    let confirm = window.confirm(`Are you sure you want to delete your profile ${this.state.user.username}?`);
    if(confirm === false) {
      this.setState({
        redirect: null,
      });
    } else { 
      axios.delete(`/user/${id}`)
      .then(res => {
        this.setState({
          user: null,
          redirect: '/',
          auth: false,
          });
      }).catch(err => {
          console.log(err);
      });
    }
  }

  // creates a new user account, gets the new user's initial 10 random cards,
  // redirects them to their dashboard
  handleRegisterSubmit = (e, username, password, email, displayName) => {
    e.preventDefault();
    axios.post('/auth/register', {
      username,
      password,
      email,
      displayName,
    })
    .then(res => {
      this.setState({
        auth: res.data.auth,
        user: res.data.user,
      });
    })
    .then(
      this.getInitialUserCards,
      this.setState({
        redirect: '/user',
      })
    )
    .catch(err => 
      console.log(err));
  }

  // logs user out
  logOut = () => {
    axios.get('/auth/logout')
    .then(res => {
      console.log(res);
      this.setState({
        auth: false,
        redirect: '/',
      });
    }).catch(err => 
      console.log(err));
  }

  // sets which card is currently being edited so it can be edited without going
  // to another page
  userSelectedCardToEdit = (id) => {
    console.log(id);
    this.setState({
      currentCardId: id,
    });
  }

  // edits the user's card, then reloads the users cards to reflect the changes
  userSubmitEdit = (event) => {
    event.preventDefault();
    console.log(this.state.currentCardId)
    axios.put(`/usercard/${this.state.currentCardId}`, {
      name: event.target.name.value,
    }).then(res => {
      this.getUserCards();
    }).then(() => {
      this.setState({
        currentCardId: null,
      })
    }).catch(err => 
    {console.log(err) });
  }

  // sets that the user is currently being edited so it can be edited without going
  // to another page
  userSelectedNameToEdit = (id) => {
    console.log(id);
    this.setState({
      currentUserId: id,
    })
  }
  
  // edits the users display name and email, resets them in state
  userSubmitNewName = (event) => {
    event.preventDefault();
    let display_name = event.target.display_name.value;
    let email = event.target.email.value;
    axios.put(`/user/${this.state.currentUserId}`, {
      displayName: event.target.display_name.value,
      email: event.target.email.value,
    }).then(res => {
      let newUserData = this.state.user;
      newUserData.display_name = display_name;
      newUserData.email = email;
        this.setState({
          user: newUserData,
          currentContent: 'user-cards',
          redirect: '/user',  
          currentUserId: null,
        })
    }).catch(err => 
    {console.log(err) });
  };

  // updates users wins and currency when they win a game
  updateWinsNCurrency = () =>{
    let updatedCurrency = this.state.user.currency;
    updatedCurrency += 10;
    let updatedWins = this.state.user.wins;
    updatedWins += 1;
    this.setState({
      user: {
        currency: updatedCurrency,
        display_name: this.state.user.display_name,
        email: this.state.user.email,
        id: this.state.user.id,
        password_digest: this.state.user.password_digest,
        username: this.state.user.username,
        wins: updatedWins,
      }
    })
    axios.put(`/user/win`, {
      username: this.state.user.username,
      wins: this.state.user.wins,
      currency: this.state.user.currency,
    }).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    })
  }

  render() {
    // redirects the page if there's a redirect set, otherwise displays as normal
    if(this.state.redirect !== null) {
      let redir = this.state.redirect;
      this.setState({
        redirect: null,
      });
      return ( 
        <Router>
          <Redirect push to = {redir} />
        </Router>
      )
    } else {
    return (
      <Router>
      <div className = 'App'>
        <Header setPage = {this.setPage} user = {this.state.user} display_name = {this.props.display_name} auth = {this.state.auth} logOut = {this.logOut} setCurrentPage = {this.setCurrentPage} currentPage = {this.state.currentPage}/>
        <main>
          {/* all of the routes */}
          <Route exact path = '/' render = {() => <Home handleLoginSubmit = {this.handleLoginSubmit} />} />
          <Route exact path = '/register' render = {() => <Register handleRegisterSubmit = {this.handleRegisterSubmit} />} />
          <Route exact path = '/user' render = {() => <Dashboard 
                                                    setContent = {this.setContent} 
                                                    currentContent = {this.state.currentContent}
                                                    cards = {this.state.cardData} 
                                                    userCards = {this.state.userCardData} 
                                                    newCard = {this.state.newCardData}
                                                    userSubmitEdit = {this.userSubmitEdit} 
                                                    userSelectedCardToEdit = {this.userSelectedCardToEdit} 
                                                    currentCardId = {this.state.currentCardId}
                                                    getNewUserCard = {this.getNewUserCard}
                                                    getNewUserCardPremium = {this.getNewUserCardPremium} 
                                                    deleteUserCard = {this.deleteUserCard}
                                                    user = {this.state.user}
                                                    email = {this.state.email}
                                                    display_name = {this.state.display_name}
                                                    userSubmitNewName = {this.userSubmitNewName}
                                                    userSelectedNameToEdit = {this.userSelectedNameToEdit}
                                                    currentUserId = {this.state.currentUserId}
                                                    deleteUser = {this.deleteUser} />} />
          <Route exact path = '/joingame' render = {() => <GameLobby players = {this.state.players} users = {this.state.users} />} />
          <Route exact path = '/joingame/:id' render = {(props) => <GameRoom 
                                                                  user = {this.state.user} 
                                                                  id = {props.match.params.id} 
                                                                  userCards = {this.state.userCardData} 
                                                                  updateLobbyPlayersAndUsers = {this.updateLobbyPlayersAndUsers}
                                                                  updateWinsNCurrency = {this.updateWinsNCurrency}/>}/>
        </main>
        <Footer />
      </div>
      </Router>
    );
  }
}
}

export default App;
