import React, { Component } from 'react';
import axios from 'axios';

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
import GameRoom from './components/GameRoom';


class App extends Component {
  constructor() {
    super();
    this.state = {
      auth: false,
      cardData: null,
      cardDataLoaded: false,
      userCardData: null,
      user: null,
      currentPage: 'home',
      fireRedirectToDashboard: false,
      fireRedirectToLogin: false,
      currentCardId: null,
    }
    this.handleLoginSubmit = this.handleLoginSubmit.bind(this); 
    this.logOut = this.logOut.bind(this);    
    this.handleRegisterSubmit = this.handleRegisterSubmit.bind(this);
    this.getUserCards = this.getUserCards.bind(this);
    this.getNewUserCards = this.getNewUserCards.bind(this);
    this.requireLogin = this.requireLogin.bind(this);
    this.userSelectedCardToEdit = this.userSelectedCardToEdit.bind(this);
  }

  componentDidMount() {
    axios.get('/cards')
      .then((res) => {
        console.log(res.data)
        this.setState({
          cardData: res.data,
          cardDataLoaded: true,
        });
      }).catch(err => console.log(err));

    this.requireLogin();
  }

  requireLogin() {
    if(!this.state.auth) {
      this.setState({
        fireRedirectToLogin: true,
      });
    };
  }

  //AUTH
  handleLoginSubmit(e, username, password) {
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
      this.getUserCards();
      this.setState({
        fireRedirectToDashboard: true
      })
    })
    .catch(err => console.log(err));
  }

  getUserCards() {
    axios.get('/usercard')
    .then(res=>{
      console.log(res.data)
      this.setState({
        userCardData: res.data,
      })
    })
    .catch(err=>{
      console.log(err);
    })
  }

  getNewUserCards(){
    axios.get('/user/new')
    .then(res => {
      console.log(res.data)
      this.setState({
        userCardData: res.data
      })
    })
    .then(()=>{
      this.state.userCardData.forEach((data)=>{
        axios.post('/usercard/new',{
          cardId: data.id,
          name: data.name,
          class: data.class,
          attack: data.attack,
          defense: data.defense,
          imageUrl: data.image_url
        })
        .then(res=>{
          console.log(res)
        })
        .catch(err=>{
          console.log(err)
        })
      })
    })
    .catch(err=>{
        console.log(err);
    })
  }

  handleRegisterSubmit(e, username, password, email, displayName) {
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
      this.getNewUserCards,
      this.setState({
        fireRedirectToDashboard: true,
      })
    )
    .catch(err => console.log(err));
  }

  logOut() {
    axios.get('/auth/logout')
    .then(res => {
      console.log(res);
      this.setState({
        auth:false,
        fireRedirectToLogin: true,
      });
    }).catch(err => console.log(err));
  }

  userSelectedCardToEdit(id) {
    console.log(id);
    this.setState({
      currentCardId: id,
    })
  }

  render() {
    return (
      <Router>
      <div className="App">
        <Header setPage={this.setPage} auth={this.state.auth} logOut={this.logOut} />
        <main>
          <Route exact path='/' render={() => <Home handleLoginSubmit={this.handleLoginSubmit} />} />
          <Route exact path='/register' render={() => <Register handleRegisterSubmit={this.handleRegisterSubmit} />} />
          <Route exact path='/user' render={() => <Dashboard cards={this.state.cardData} userSubmitEdit={this.userSubmitEdit} currentCardId={this.state.currentCardId} userCards={this.state.userCardData} />} />
          {this.state.fireRedirectToDashboard ? <Redirect push to={'/user'} /> : '' }
          {this.state.fireRedirectToLogin ? <Redirect push to={'/'} /> : '' }
          <Route exact path='/joingame' render={() => <GameRoom />} />
        </main>
        <Footer />
      </div>
      </Router>
    );
  }
}

export default App;
