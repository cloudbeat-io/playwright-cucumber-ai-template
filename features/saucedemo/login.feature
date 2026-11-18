Feature: Login
  As a Swag Labs customer
  I want to sign in with my username and password
  So that I can shop

  Background:
    Given the user opens the Swag Labs login page

  @smoke @ui
  Scenario: Standard user logs in
    When I log in as "standard_user" with password "secret_sauce"
    Then the page title is "Products"
    And the cart is empty

  @ui
  Scenario: Error user logs in
    When I log in as "error_user" with password "secret_sauce"
    Then the page title is "Products"
    And the selected sort option is "Name (A to Z)"
    And the catalog shows 6 products

  @ui
  Scenario: User logs out
    Given I log in as "standard_user" with password "secret_sauce"
    When I log out
    Then the login form is shown

  @ui @validation
  Scenario Outline: Login is rejected: <case>
    When I log in as "<username>" with password "<password>"
    Then the login error "<error>" is shown

    Examples:
      | case             | username        | password     | error                                                                      |
      | locked-out user  | locked_out_user | secret_sauce | Epic sadface: Sorry, this user has been locked out.                        |
      | wrong password   | standard_user   | wrong        | Epic sadface: Username and password do not match any user in this service |
      | missing username |                 | secret_sauce | Epic sadface: Username is required                                         |
      | missing password | standard_user   |              | Epic sadface: Password is required                                         |
