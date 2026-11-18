Feature: Checkout
  As a logged-in customer
  I want to check out the products in my cart
  So that I can place an order

  Background:
    Given I am logged in as "standard_user"

  @smoke @ui
  Scenario: Buy one product
    Given I add "Sauce Labs Backpack" to the cart
    And I open the cart
    Then the cart contains "Sauce Labs Backpack"
    When I check out with first name "Jane", last name "Doe" and postal code "12345"
    Then the item total is 29.99
    And the order total equals the item total plus tax
    When I finish the order
    Then the order confirmation "Thank you for your order!" is shown
    And the cart is empty

  @ui
  Scenario: Item total is the sum of the product prices
    Given I add "Sauce Labs Backpack" to the cart
    And I add "Sauce Labs Bike Light" to the cart
    And I open the cart
    When I check out with first name "Jane", last name "Doe" and postal code "12345"
    Then the item total is 39.98
    And the order total equals the item total plus tax

  @ui @validation
  Scenario Outline: Checkout information is required: <missing field>
    Given I add "Sauce Labs Backpack" to the cart
    And I open the cart
    When I check out with first name "<first name>", last name "<last name>" and postal code "<postal code>"
    Then the checkout error "<error>" is shown

    Examples:
      | missing field | first name | last name | postal code | error                          |
      | first name    |            | Doe       | 12345       | Error: First Name is required  |
      | last name     | Jane       |           | 12345       | Error: Last Name is required   |
      | postal code   | Jane       | Doe       |             | Error: Postal Code is required |
