Feature: Product catalog
  As a logged-in customer
  I want to browse, sort and pick products
  So that I can find what I want to buy

  Background:
    Given I am logged in as "standard_user"

  @smoke @ui
  Scenario: Catalog lists all products
    Then the catalog shows 6 products

  @ui
  Scenario: Products page shows the full catalog after login
    Then the page title is "Products"
    And the selected sort option is "Name (A to Z)"
    And the catalog lists these products:
      | name                              | price  |
      | Sauce Labs Backpack               | $29.99 |
      | Sauce Labs Bike Light             | $9.99  |
      | Sauce Labs Bolt T-Shirt           | $15.99 |
      | Sauce Labs Fleece Jacket          | $49.99 |
      | Sauce Labs Onesie                 | $7.99  |
      | Test.allTheThings() T-Shirt (Red) | $15.99 |
    And every product shows an image, a description and an "Add to cart" button
    And the cart is empty
    And the footer shows the social links "X, Facebook, LinkedIn"

  @ui
  Scenario Outline: Sort products by "<sort option>"
    When I sort products by "<sort option>"
    Then the first product is "<first product>"

    Examples:
      | sort option         | first product                     |
      | Name (A to Z)       | Sauce Labs Backpack               |
      | Name (Z to A)       | Test.allTheThings() T-Shirt (Red) |
      | Price (low to high) | Sauce Labs Onesie                 |
      | Price (high to low) | Sauce Labs Fleece Jacket          |

  @ui
  Scenario: Sorting by price orders all products by price
    When I sort products by "Price (low to high)"
    Then the product prices are in ascending order

  @ui
  Scenario: Cart badge follows added and removed products
    When I add "Sauce Labs Backpack" to the cart
    And I add "Sauce Labs Bike Light" to the cart
    Then the cart badge shows 2
    When I remove "Sauce Labs Backpack" from the cart
    Then the cart badge shows 1
