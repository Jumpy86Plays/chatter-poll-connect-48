import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [voters, setVoters] = useState([]);
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [currentUser]);

  function login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@gmail.com' && password === 'admin123') {
          const user = { email, isAdmin: true };
          setCurrentUser(user);
          setLoggedInUsers(prev => [...prev, email]);
          localStorage.setItem('user', JSON.stringify(user));
          resolve(user);
        } else if (email === 'user@example.com' && password === 'password') {
          const user = { email, isAdmin: false };
          setCurrentUser(user);
          setLoggedInUsers(prev => [...prev, email]);
          localStorage.setItem('user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  }

  function signIn(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = { email, isAdmin: false };
        setCurrentUser(user);
        setLoggedInUsers(prev => [...prev, email]);
        localStorage.setItem('user', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  }

  function logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        setCurrentUser(null);
        setLoggedInUsers(prev => prev.filter(user => user !== currentUser.email));
        localStorage.removeItem('user');
        if (socket) {
          socket.close();
          setSocket(null);
        }
        resolve();
      }, 1000);
    });
  }

  function addVoter(voter) {
    setVoters(prev => [...prev, voter]);
  }

  function addPoll(newPoll) {
    setPolls(prev => [...prev, { ...newPoll, id: Date.now().toString(), totalVotes: 0 }]);
  }

  function vote(pollId, option) {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const updatedVotes = { ...poll.votes, [option]: (poll.votes[option] || 0) + 1 };
        return { ...poll, votes: updatedVotes, totalVotes: poll.totalVotes + 1 };
      }
      return poll;
    }));
    addVoter(currentUser.email);
  }

  function addOption(pollId, option) {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        return { ...poll, options: [...poll.options, option] };
      }
      return poll;
    }));
  }

  function removeOption(pollId, option) {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const updatedOptions = poll.options.filter(o => o !== option);
        const { [option]: removedVotes, ...updatedVotes } = poll.votes;
        return { 
          ...poll, 
          options: updatedOptions, 
          votes: updatedVotes,
          totalVotes: poll.totalVotes - (removedVotes || 0)
        };
      }
      return poll;
    }));
  }

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
      setLoggedInUsers(prev => [...prev, user.email]);
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    login,
    signIn,
    logout,
    socket,
    loggedInUsers,
    voters,
    addVoter,
    polls,
    addPoll,
    vote,
    addOption,
    removeOption
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}