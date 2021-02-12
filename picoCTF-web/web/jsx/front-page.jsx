const { Input } = ReactBootstrap;
const { Row } = ReactBootstrap;
const { Col } = ReactBootstrap;
const { Button } = ReactBootstrap;
const { Panel } = ReactBootstrap;
const { Glyphicon } = ReactBootstrap;
const { ButtonInput } = ReactBootstrap;
const { ButtonGroup } = ReactBootstrap;
const { Alert } = ReactBootstrap;

const { update } = React.addons;

const Recaptcha = ReactRecaptcha;

const LoginForm = React.createClass({
  render() {
    let q;
    const userGlyph = <Glyphicon glyph="user" />;
    const lockGlyph = <Glyphicon glyph="lock" />;

    const formButton = this.props.status === "Login" ? (q = "'") : undefined; //My syntax highlighting can't handle literal quotes in jsx. :(
    if (this.props.status === "Reset") {
      return (
        <Panel>
          <form onSubmit={this.props.onPasswordReset}>
            <p>
              <i>A password reset link will be sent the user{q}s email.</i>
            </p>
            <Input
              type="text"
              name="username"
              valueLink={this.props.username}
              addonBefore={userGlyph}
              placeholder="Username"
              required={true}
            />
            <div style={{ height: "70px" }} />
            <Row>
              <Col md={6}>
                <ButtonInput type="submit">Reset Password</ButtonInput>
              </Col>
              <Col md={6}>
                <span className="pull-right pad">
                  Go back to{" "}
                  <a onClick={this.props.setPage.bind(null, "Login")}>Login</a>.
                </span>
              </Col>
            </Row>
          </form>
        </Panel>
      );
    } else {
      const showGroupMessage = () => {
        return (
          <Alert bsStyle="info">
            You are registering as a member of <strong>{this.props.groupName}</strong>
          </Alert>
        );
      };

      const showEmailFilter = () => {
        return (
          <p className="alert alert-info">
            You can register provided you have an email for one of these domains:
            <strong>{this.props.emailFilter.join(", ")}</strong>
          </p>
        );
      };

      const generateRecaptcha = () => {
        if (this.props.reCAPTCHA_public_key) {
          return (
            <Recaptcha
              sitekey={this.props.reCAPTCHA_public_key}
              verifyCallback={this.props.onRecaptchaSuccess}
              expiredCallback={this.props.onRecaptchaExpire}
              render="explicit"
            />
          );
        }
      };
      const registrationForm =
        this.props.status === "Register" ? (
          <div>
            <Row>
              <div>
                {this.props.groupName.length > 0 ? (
                  showGroupMessage()
                ) : (
                  <span />
                )}
                {this.props.emailFilter.length > 0 && !this.props.rid ? (
                  showEmailFilter()
                ) : (
                  <span />
                )}
                <br />
              </div>
              <Col md={6} className="firstname">
                <Input
                  type="text"
                  id="firstname"
                  valueLink={this.props.firstname}
                  label="First Name"
                  placeholder="Jane"
                />
              </Col>
              <Col md={6} className="lastname">
                <Input
                  type="text"
                  id="lastname"
                  valueLink={this.props.lastname}
                  label="Last Name"
                  placeholder="Doe"
                />
              </Col>
              <Col md={12}>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  valueLink={this.props.email}
                  label="E-mail *"
                  placeholder="email@example.com"
                  required={true}
                />
              </Col>
            </Row>
            <Row>
              <Col md={8}>{generateRecaptcha()}</Col>
              <Col md={4} className="text-right">
                <ButtonInput className="btn-primary" type="submit">
                  Register
                </ButtonInput>
              </Col>
            </Row>
          </div>
        ) : (
          <span />
        );
      return (
        <Panel>
          <form
            key={this.props.status}
            onSubmit={
              this.props.status === "Login"
                ? this.props.onLogin
                : this.props.onRegistration
            }
          >
            <Input
              type="text"
              id="username"
              valueLink={this.props.username}
              addonBefore={userGlyph}
              label="Username"
              required={true}
            />
            <p
              className={this.props.status === "Login" ? "hide" : "alert alert-warning"}
            >{`Your username may be visible to other users.
Do not include your real name or any other personal information.`}</p>
            <Input
              type="password"
              id="password"
              valueLink={this.props.password}
              addonBefore={lockGlyph}
              label="Password"
              required={true}
            />
            <Row>
              <Col md={6}>
                {this.props.status === "Register" ? (
                  <span className="pad">
                    Go back to{" "}
                    <a onClick={this.props.setPage.bind(null, "Login")}>
                      Login
                    </a>
                    .
                  </span>
                ) : (
                  <span>
                    <Button type="submit">Login</Button>
                    <Button
                      id="set-register"
                      onClick={this.props.setPage.bind(null, "Register")}
                    >
                      Register
                    </Button>
                  </span>
                )}
              </Col>
              <Col md={6}>
                <a
                  className="pad"
                  onClick={this.props.setPage.bind(null, "Reset")}
                >
                  Need to reset your password?
                </a>
              </Col>
            </Row>
            {registrationForm}
          </form>
        </Panel>
      );
    }
  }
});

const TeamManagementForm = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  getInitialState() {
    return {
      team_name: "",
      team_password: ""
    };
  },

  onTeamRegistration(e) {
    e.preventDefault();
    if (!this.state.team_name || !this.state.team_password) {
      apiNotify({
        status: 0,
        message: "Invalid team name or password."
      });
    } else {
      const data = {
        team_name: this.state.team_name,
        team_password: this.state.team_password
      };
      apiCall("POST", "/api/v1/teams", data, "Team", "CreateTeamOnReg")
        .done(data => (document.location.href = "/profile"))
        .fail(jqXHR =>
          apiNotify({ status: 0, message: jqXHR.responseJSON.message })
        );
    }
  },

  onTeamJoin(e) {
    e.preventDefault();
    const data = {
      team_name: this.state.team_name,
      team_password: this.state.team_password
    };
    apiCall("POST", "/api/v1/team/join", data, "Team", "JoinTeamOnReg")
      .done(data => (document.location.href = "/profile"))
      .fail(jqXHR =>
        apiNotify({ status: 0, message: jqXHR.responseJSON.message })
      );
  },

  render() {
    const towerGlyph = <Glyphicon glyph="tower" />;
    const lockGlyph = <Glyphicon glyph="lock" />;

    return (
      <Panel>
        <p className="alert alert-warning">Your team name may be visible to other users. Do not include your real name or any other personal information.
          Also, to avoid confusion on the scoreboard, you may not create a team that shares the same name as an existing user.</p>
        <form onSubmit={this.onTeamJoin}>
          <Input type="text" valueLink={this.linkState("team_name")} addonBefore={towerGlyph} label="Team Name" required/>
          <Input type="password" valueLink={this.linkState("team_password")} addonBefore={lockGlyph} label="Team Password" required/>
          <Col md={6}>
            <span> <Button type="submit">Join Team</Button>
              <Button onClick={this.onTeamRegistration}>Register Team</Button>
            </span>
          </Col>
          <Col md={6}>
            <a href="#" onClick={() => document.location.href = "/profile"}>Play as an individual.</a>
          </Col>
        </form>
      </Panel>
    );
  }
});

const AuthPanel = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState() {
    const params = $.deparam($.param.fragment());

    return {
      page: "Login",
      settings: {},
      gid: params.g,
      rid: params.r,
      status: params.status,
      groupName: "",
      captcha: "",
      regStats: {}
    };
  },

  componentWillMount() {
    if (this.state.status === "verified") {
      gtag('event', 'Verification', {
        'event_category': 'Registration',
        'event_label': 'Success'
      });
      apiNotify({
        status: 1,
        message: "Your account has been successfully verified. Please login."
      });
    } else if (this.state.status === "verification_error") {
      apiNotify({
        status: 0,
        message: "Invalid verification code. Please contact an administrator."
      });
    }
    apiCall("GET", "/api/v1/settings").done(data => {
      this.setState({ settings: data });
      if (this.state.gid) {
        apiCall("GET", `/api/v1/groups/${this.state.gid}`).done(data => {
          this.setState(
            update(this.state, {
              groupName: { $set: data.name },
              affiliation: { $set: data.name },
              settings: { $merge: data.settings },
              page: { $set: "Register" }
            })
          );
        });
      }
    });

    apiCall("GET", "/api/v1/stats/registration").done(data => {
      this.setState(update(this.state, { regStats: { $set: data } }));
    });
  },

  onRegistration(e) {
    e.preventDefault();

    if (this.state.settings.enable_captcha && this.state.captcha === "") {
      apiNotify({ status: 0, message: "ReCAPTCHA required." });
      return;
    }

    const form = {};
    form.gid = this.state.gid;
    form.rid = this.state.rid;
    form.username = this.state.username;
    form.password = this.state.password;
    form.firstname = this.state.firstname;
    form.lastname = this.state.lastname;
    form.email = this.state.email;

    form["g-recaptcha-response"] = this.state.captcha;

    apiCall("POST", "/api/v1/users", form, "Registration", "Form")
      .done(data => {
        const verificationAlert = {
          status: 1,
          message:
            "You have been sent a verification email. You will need to complete this step before logging in."
        };

        const successAlert = {
          status: 1,
          message: `User ${this.state.username} registered successfully!`
        };

        if (this.state.settings.email_verification && !this.state.rid) {
          apiNotify(verificationAlert);
          this.setPage("Login");
          if (this.state.settings.max_team_size > 1) {
            document.location.hash = "#team-builder";
          }
        } else {
          apiCall("POST", "/api/v1/user/login", {
            username: this.state.username,
            password: this.state.password
          }, "User", "LoginOnReg")
            .done(loginData => {
              apiCall("GET", "/api/v1/user")
                .done(userData => {
                  if (this.state.settings.max_team_size > 1) {
                    apiNotify(successAlert);
                    this.setPage("Team Management");
                  } else {
                    apiNotify(successAlert, "/profile");
                  }
                })
                .fail(jqXHR =>
                  apiNotify({ status: 0, message: jqXHR.responseJSON.message })
                );
            })
            .fail(jqXHR =>
              apiNotify({ status: 0, message: jqXHR.responseJSON.message })
            );
        }
      })
      .fail(jqXHR =>
        apiNotify({ status: 0, message: jqXHR.responseJSON.message })
      );
  },

  onPasswordReset(e) {
    e.preventDefault();
    apiCall("POST", "/api/v1/user/reset_password/request", {
      username: this.state.username
    }, "Authentication", "ResetPasswordRequest")
      .done(resp => {
        apiNotify({
          status: 1,
          message:
            "A password reset link has been sent to the email address provided during registration."
        });
        this.setPage("Login");
      })
      .fail(jqXHR =>
        apiNotify({ status: 0, message: jqXHR.responseJSON.message })
      );
  },

  onLogin(e) {
    e.preventDefault();
    apiCall("POST", "/api/v1/user/login", {
      username: this.state.username,
      password: this.state.password
    }, "Authentication", "Login")
      .done(() =>
        // Get teacher status
        apiCall("GET", "/api/v1/user").done(data => {
          if (document.location.hash === "#team-builder" && !data.teacher) {
            this.setPage("Team Management");
          }
          else {
              document.location.href = "/profile";
           }
          }
        )
      )
      .fail(jqXHR =>
        apiNotify({ status: 0, message: jqXHR.responseJSON.message })
      );
  },

  setPage(page) {
    this.setState(update(this.state, { page: { $set: page } }));
  },

  onRecaptchaSuccess(captcha) {
    this.setState(update(this.state, { captcha: { $set: captcha } }));
  },

  onRecaptchaExpire() {
    this.setState(update(this.state, { captcha: { $set: "" } }));
  },

  render() {
    const links = {
      username: this.linkState("username"),
      password: this.linkState("password"),
      lastname: this.linkState("lastname"),
      firstname: this.linkState("firstname"),
      email: this.linkState("email")
    };

    const showRegStats = () => {
      if (this.state.regStats) {
        return (
          <Panel>
            <h4>
              <strong>Registration Statistics</strong>
            </h4>
            <p>
              <strong>{this.state.regStats.users}</strong> users have
              registered,<strong> {this.state.regStats.teamed_users} </strong>
              of which have formed<strong> {this.state.regStats.teams} </strong>teams.
              <br />
              <strong>{this.state.regStats.groups} </strong>
              classrooms have been created by <strong>{this.state.regStats.teachers}</strong> teachers.
            </p>
          </Panel>
        );
      }
    };

    if (this.state.page === "Team Management") {
      return (
        <div>
          <Row>
            <Col md={6} mdOffset={3}>
              <TeamManagementForm />
            </Col>
          </Row>
        </div>
      );
    } else {
      return (
        <div>
          <Row>
            <Col md={6} mdOffset={3}>
              <LoginForm
                {...Object.assign(
                  {
                    setPage: this.setPage,
                    onRecaptchaSuccess: this.onRecaptchaSuccess,
                    onRecaptchaExpire: this.onRecaptchaExpire,
                    status: this.state.page,
                    reCAPTCHA_public_key: this.state.settings
                      .reCAPTCHA_public_key,
                    onRegistration: this.onRegistration,
                    onLogin: this.onLogin,
                    onPasswordReset: this.onPasswordReset,
                    emailFilter: this.state.settings.email_filter,
                    groupName: this.state.groupName,
                    rid: this.state.rid,
                    gid: this.state.gid
                  },
                  links
                )}
              />
              {showRegStats()}
            </Col>
          </Row>
        </div>
      );
    }
  }
});

$(function() {
  redirectIfLoggedIn();
  ReactDOM.render(<AuthPanel />, document.getElementById("auth-box"));
});
