import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import * as firebase from 'firebase';

class Page extends React.Component {
    constructor() {
        super();
        this.state = {
            login: false,
            uid: null,
            name: null,
            scroll: 1,
            posts: {},
            answers: {},
        };
        const config = {
            apiKey: "AIzaSyAgsh9bvpFszokoI-Q47m9PVsQuajaH_1s",
            authDomain: "pv1.firebaseapp.com",
            databaseURL: "https://pv1.firebaseio.com",
            projectId: "firebase-pv1",
            storageBucket: "firebase-pv1.appspot.com",
            messagingSenderId: "503481450871"
        };
        this.db = firebase.initializeApp(config).database();
        this.provider = new firebase.auth.FacebookAuthProvider();
        this.ref = this.db.ref('posts').limitToLast(20);
        this.handleScroll = this.handleScroll.bind(this);
    }

    componentDidMount() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.setState({login: true, uid: user.uid, name: user.displayName});
                this.ansRef = this.db.ref('users/' + this.state.uid + "/answers");
                this.ansRef.on('value', (snap) => this.setState({answers: snap.val()}))
            }
            else this.setState({login: false, name: null});
        });
        this.ref.on('value', (snap) => this.setState({posts: snap.val()}));
        window.addEventListener("scroll", this.handleScroll);
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
    }

    handleScroll() {
        const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
        const body = document.body;
        const html = document.documentElement;
        const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
        const windowBottom = windowHeight + window.pageYOffset;
        if (windowBottom >= docHeight) {
            this.setState({scroll: this.state.scroll + 1});
            this.ref = this.db.ref('posts').limitToLast((this.state.scroll)*20);
            this.ref.on('value', (snap) => this.setState({posts: snap.val()}));
        }
    }

    login() {
        if (!this.state.login) {
            console.log("logging in");
            firebase.auth().signInWithRedirect(this.provider);
        }
        else {
            console.log("logging out");
            firebase.auth().signOut();
        }
    }

    choose(key, choice) {
        this.ansRef.child(key).set(choice);
        this.db.ref('posts/' + key + '/choices/' + choice + '/count').transaction((count) => {return count + 1;});
    }

    ask(form) {
        Object.keys(form).forEach((key) => (form[key] == '') && delete form[key]);
        let question = {
            question: form.question,
            choices: {},
        };
        delete form.question;
        Object.keys(form).forEach((choice) => {
            question.choices[choice] = {
                text: form[choice],
                count: 0,
            }
        })
        this.db.ref('posts').push().set(question);
    }

    render() {
        return (
            <div>
                <Navbar
                    loginState = {this.state.login}
                    name = {this.state.name}
                    login = {() => this.login()}
                />

                <div className = "container theme-showcase">
                    <Question ask = {(form) => this.ask(Object.assign({}, form))} />
                    <Feed
                        posts = {this.state.posts}
                        answers = {this.state.answers}
                        choose = {(key, choice) => this.choose(key, choice)}
                    />
                </div>
            </div>
        );
    }

}

function Navbar(props) {
    var loginString;
    if (props.loginState === true) {
        loginString = props.name + " - Logout";
    }
    else if (props.loginState === false) {
        loginString = "Login";
    }
    else {
        loginString = "Null";
    }
    return (
        <nav className = "navbar navbar-inverse navbar-fixed-top">
            <div className = "container">
                <div className = "navbar-header">
                    <a className = "navbar-brand" href = "#">PollVault</a>
                </div>
                <div>
                    <ul className = "nav navbar-nav pull-right">
                        <li><a onClick = {() => props.login()}>{loginString}</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

class Question extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            question: '',
            choice1: '',
            choice2: '',
            choice3: '',
            choice4: '',
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        const {name, value} = event.target;
        this.setState({[name]: value});
    }

    handleSubmit() {
        event.preventDefault();
        this.props.ask(this.state);
        this.refs.question.value = '';
        this.refs.choice1.value = '';
        this.refs.choice2.value = '';
        this.refs.choice3.value = '';
        this.refs.choice4.value = '';
    }

    render() {
        return(
            <div className = "jumbotron">
                <form className = "form" onSubmit = {() => this.handleSubmit()}>
                    <h1>Ask a Question!</h1>
                    <p>Anything you want to know? Ask the crowd here. Write at least two choices for people to choose from.</p>
                    <textarea
                        name = "question" ref = "question" rows = "4" className = "form-control input-lg"
                        placeholder = "Your Question" maxLength = "300" style = {{resize: "none"}} required autoFocus
                        onChange = {this.handleChange} />
                    <br />
                    <input type = "text" name = "choice1" ref = "choice1" className = "form-control" placeholder = "Choice 1" onChange = {this.handleChange} required />
                    <input type = "text" name = "choice2" ref = "choice2" className = "form-control" placeholder = "Choice 2" onChange = {this.handleChange} required />
                    <input type = "text" name = "choice3" ref = "choice3" className = "form-control" placeholder = "Choice 3" onChange = {this.handleChange} />
                    <input type = "text" name = "choice4" ref = "choice4" className = "form-control" placeholder = "Choice 4" onChange = {this.handleChange} />
                    <br />
                    <p>To ask a question, please login using Facebook :)</p>
                    <button className = "btn btn-lg btn-primary btn-block" type = "submit">Submit</button>
                </form>
            </div>
        );
    }
}

function Feed(props) {
    const postList = Object.keys(props.posts).reverse().map((key) =>
        <Post
            post = {props.posts[key]}
            answer = {props.answers[key]}
            choose = {(choice) => props.choose(key, choice)}
        />
    );
    return(
        <div>
            <div className = "page-header">
                <h1>Latest Questions</h1>
            </div>
            <div className = "row">
                <div className = "col-md-12">
                    {postList}
                </div>
            </div>
        </div>
    );
}

function Post(props) {
    if (props.answer) {
        const totalCount =  Object.keys(props.post.choices).map((choiceKey) => props.post.choices[choiceKey].count).reduce((a, b) => (a + b), 0);
        const choices = Object.keys(props.post.choices).map((choiceKey) =>
            <a className = {"row choice list-group-item list-group-item-" + ((choiceKey == props.answer) ? "primary" : "default")}>
                {props.post.choices[choiceKey].text}
                <div className = "col-xs-8 pull-right ">
                    <div className = "progress">
                        <div
                            className = {"progress-bar progress-bar-" + ((choiceKey == props.answer) ? "info" : "default")}
                            role = "progressbar"
                            style = {{width: (100*props.post.choices[choiceKey].count/totalCount) + "%"}}
                        />
                    </div>
                </div>
            </a>
        );
        return (
            <ul className = "list-group">
                <li className = "list-group-item"><h4>{props.post.question}</h4></li>
                {choices}
            </ul>
        );
    }
    else {
        const choices = Object.keys(props.post.choices).map((choiceKey) =>
            <a className = "row choice list-group-item" onClick = {() => props.choose(choiceKey)}>{props.post.choices[choiceKey].text}</a>
        );
        return (
        <ul className = "list-group">
        <li className = "list-group-item"><h4>{props.post.question}</h4></li>
        {choices}
        </ul>
        );
    }
}

ReactDOM.render(<Page />, document.getElementById("root"));
