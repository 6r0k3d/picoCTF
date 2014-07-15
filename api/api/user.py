"""
API functions relating to user management and registration.
"""

from voluptuous import Required, Length, Schema
from api.common import check, validate, safe_fail
from api.common import WebException, InternalException

import api.team
import api.common
import api.auth

import bcrypt

import re

user_schema = Schema({
    Required('email'): check(
        ("Email must be between 5 and 50 characters.", [str, Length(min=5, max=50)]),
        ("This does not look like an email address.", [
            lambda email: re.match(r"[A-Za-z0-9\._%+-]+@[A-Za-z0-9\.-]+\.[A-Za-z]{2,4}", email) is not None])
    ),
    Required('username'): check(
        ("Usernames must be between 3 and 50 characters.", [str, Length(min=3, max=50)]),
        ("This username already exists.", [
            lambda name: safe_fail(get_user, name=name) is None])
    ),
    Required('password'):
        check(("Passwords must be between 3 and 50 characters.", [str, Length(min=3, max=50)]))
}, extra=True)

new_team_schema = Schema({
    Required('team-name-new'): check(
        ("The team name must be between 3 and 50 characters.", [str, Length(min=3, max=50)]),
        ("A team with that name already exists.", [
            lambda name: safe_fail(api.team.get_team, name=name) is None])
    ),
    Required('team-password-new'):
        check(("Team passwords must be between 3 and 50 characters.", [str, Length(min=3, max=50)])),
    Required('team-adv-name-new'):
        check(("Adviser names should be between 3 and 50 characters.", [str, Length(min=3, max=50)])),
    Required('team-adv-email-new'):
        check(("Adviser emails must be between 5 and 100 characters.", [str, Length(min=5, max=100)])),
    Required('team-school-new'):
        check(("School names must be between 3 and 150 characters.", [str, Length(min=3, max=150)]))

}, extra=True)

existing_team_schema = Schema({
    Required('team-name-existing'): check(
        ("Existing team names must be between 3 and 50 characters.", [str, Length(min=3, max=50)]),
        ("There is no existing team named that.", [
            lambda name: api.team.get_team(name=name) != None]),
        ("There are too many members on that team for you to join.", [
            lambda name: len(api.team.get_team_uids(name=name)) < api.team.max_team_users
        ])
    ),
    Required('team-password-existing'):
        check(("Team passwords must be between 3 and 50 characters.", [str, Length(min=3, max=50)]))
}, extra=True)

def hash_password(password):
    """
    Hash plaintext password.

    Args:
        password: plaintext password
    Returns:
        Secure hash of password.
    """

    return bcrypt.hashpw(password, bcrypt.gensalt(8))

def get_team(uid=None):
    """
    Retrieve the the corresponding team to the user's uid.

    Args:
        uid: user's userid
    Returns:
        The user's team.
    """

    user = get_user(uid=uid)
    return api.team.get_team(tid=user["tid"])

def get_user(name=None, uid=None):
    """
    Retrieve a user based on a property. If the user is logged in,
    it will return that user object.

    Args:
        name: the user's username
        uid: the user's uid
    Returns:
        Returns the corresponding user object or None if it could not be found
    """

    db = api.common.get_conn()

    match = {}

    if uid is not None:
        match.update({'uid': uid})
    elif name is not None:
        match.update({'username': name})
    elif api.auth.is_logged_in():
        match.update({'uid': api.auth.get_uid()})
    else:
        raise InternalException("Uid or name must be specified for get_user")

    user = db.users.find_one(match)

    if user is None:
        raise InternalException("User does not exist")

    return user


def create_user(username, email, password_hash, tid):
    """
    This inserts a user directly into the database. It assumes all data is valid.

    Args:
        username: user's username
        email: user's email
        password_hash: a hash of the user's password
        tid: the team id to join
    Returns:
        Returns the uid of the newly created user
    """

    db = api.common.get_conn()
    uid = api.common.token()

    if safe_fail(get_user, name=username) is not None:
        raise InternalException("User already exists!")

    db.users.insert({
        'uid': uid,
        'username': username,
        'email': email,
        'password_hash': password_hash,
        'tid': tid,
        'avatar': 3,
        'eventid': 0,
        'level': 'Not Started'
    })

    return uid

def get_all_users():
    """
    Returns:
        Returns the uid, username, and email of all users.
    """

    db = api.common.get_conn()
    return list(db.users.find({}, {"uid": 1, "username": 1, "email": 1, "tid": 1}))


def create_user_request(params):
    """
    Registers a new user and creates/joins a team. Validates all fields.
    Assume arguments to be specified in a dict.

    Args:
        username: user's username
        password: user's password
        email: user's email
        create-new-team:
            boolean "true" indicating whether or not the user is creating a new team or
            joining an already existing team.

        team-name-existing: Name of existing team to join.
        team-password-existing: Password of existing team to join.

        team-name-new: Name of new team.
        team-adv-name-new: Name of adviser.
        team-adv-email-new: Adviser's email address.
        team-school-new: Name of the team's school.
        team-password-new: Password to join team.

    """

    validate(user_schema, params)

    if params.get("create-new-team", None) == "on":
        validate(new_team_schema, params)

        team_params = {
            "team_name": params["team-name-new"],
            "adviser_name": params["team-adv-name-new"],
            "adviser_email": params["team-adv-email-new"],
            "school": params["team-school-new"],
            "password" : params["team-password-new"]
        }

        if safe_fail(api.team.get_team, name=params["team-name-new"]) is not None:
            raise WebException("Team {} already exists!".format(params['team-name-new']))

        tid = api.team.create_team(team_params)

        if tid is None:
            raise InternalException("Failed to create new team")
        team = api.team.get_team(tid=tid)
    else:
        validate(existing_team_schema, params)

        team = api.team.get_team(name=params["team-name-existing"])

        if team['password'] != params['team-password-existing']:
            raise WebException("Your team password is incorrect.")


    # Create new user
    uid = create_user(
        params["username"],
        params["email"],
        hash_password(params["password"]),
        team["tid"]
    )

    if uid is None:
        raise InternalException("There was an error during registration.")

    return uid

def update_password(uid, password):
    """
    Updates an account's password.

    Args:
        uid: user's uid.
        password: the new user password.
    """

    db = api.common.get_conn()
    db.users.update({'uid': uid}, {'$set': {'password_hash': hash_password(password)}})

def update_password_request(params, uid=None):
    """
    Update account password.
    Assumes all args are keys in params.

    Args:
        password: the new password.
        confirm-password: confirmation of passwod.
    """

    if uid is None:
        uid = get_user()["uid"]

    if params["password"] != params["confirm-password"]:
        raise WebException("Your passwords do not match.")

    if len(params["password"]) == 0:
        raise WebException("Your password cannot be empty.")

    update_password(uid, params["password"])

def get_ssh_account(uid):
    """
    Gets a webshell account for the user.

    Args:
        uid: the user's user id
    Returns:
        A dict with the username and password of the account.
    """

    db = api.common.get_conn()
    sshacct = db.sshaccts.find_one({'uid': uid})
    if sshacct is not None:
        return {'username': sshacct['user'], 'password': sshacct['password']}
    sshacct = db.sshaccts.find_one({'$or': [{'uid': ''}, {'uid': {'$exists': False}}]})
    if sshacct is not None:
        db.sshaccts.update({'_id': sshacct['_id']}, {'$set': {'uid': uid}})
        return {'username': sshacct['user'], 'password': sshacct['password']}
    raise WebException("No free SSH accounts were found, please notify and administrator.")
