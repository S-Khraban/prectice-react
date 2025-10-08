/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState } from 'react';
import classNames from 'classnames';
import './App.scss';

import usersFromServer from './api/users';
import categoriesFromServer from './api/categories';
import productsFromServer from './api/products';

const buildProducts = (rawProducts, categories, users) => {
  return rawProducts.map(product => {
    const category = categories.find(c => c.id === product.categoryId);
    const user = users.find(u => u.id === category?.ownerId);

    return {
      id: product.id,
      name: product.name,
      category,
      user,
    };
  });
};

const SORT_ORDER_CYCLE = [null, 'asc', 'desc'];
const getNextSortOrder = current => {
  const i = SORT_ORDER_CYCLE.indexOf(current);

  return SORT_ORDER_CYCLE[(i + 1) % SORT_ORDER_CYCLE.length];
};

const getSortIcon = (isActive, order) => {
  if (!isActive || !order) return 'fa-sort';

  return order === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
};

export const App = () => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [sortState, setSortState] = useState({ by: null, order: null });
  const [enrichedProducts] = useState(() =>
    buildProducts(productsFromServer, categoriesFromServer, usersFromServer));

  const filteredProducts = enrichedProducts
    .filter(product =>
      selectedUserId ? product.user?.id === selectedUserId : true)
    .filter(product =>
      searchQuery
        ? product.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        : true)
    .filter(product =>
      selectedCategoryIds.length > 0
        ? selectedCategoryIds.includes(product.category?.id)
        : true);

  const displayedProducts = (() => {
    const { by, order } = sortState;

    if (!by || !order) return filteredProducts;

    const sorted = [...filteredProducts];

    sorted.sort((firstProduct, secondProduct) => {
      let firstValue;
      let secondValue;

      switch (by) {
        case 'id':
          firstValue = firstProduct.id;
          secondValue = secondProduct.id;
          break;
        case 'name':
          firstValue = firstProduct.name;
          secondValue = secondProduct.name;
          break;
        case 'category':
          firstValue = firstProduct.category?.title ?? '';
          secondValue = secondProduct.category?.title ?? '';
          break;
        case 'user':
          firstValue = firstProduct.user?.name ?? '';
          secondValue = secondProduct.user?.name ?? '';
          break;
        default:
          firstValue = 0;
          secondValue = 0;
      }

      const bothAreNumbers =
        !Number.isNaN(Number(firstValue)) && !Number.isNaN(Number(secondValue));

      let comparisonResult;

      if (bothAreNumbers) {
        comparisonResult = Number(firstValue) - Number(secondValue);
      } else {
        comparisonResult = String(firstValue).localeCompare(
          String(secondValue),
          undefined,
          { sensitivity: 'base' },
        );
      }

      return order === 'asc' ? comparisonResult : -comparisonResult;
    });

    return sorted;
  })();

  const handleUserClick = userId => e => {
    e.preventDefault();
    setSelectedUserId(userId);
  };

  const handleSearchChange = e => setSearchQuery(e.target.value);
  const handleClearSearch = () => setSearchQuery('');

  const handleToggleCategory = id => e => {
    e.preventDefault();
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleClearCategories = e => {
    e.preventDefault();
    setSelectedCategoryIds([]);
  };

  const handleResetAll = e => {
    e.preventDefault();
    setSelectedUserId(null);
    setSearchQuery('');
    setSelectedCategoryIds([]);
    setSortState({ by: null, order: null });
  };

  const handleCycleSort = by => e => {
    e.preventDefault();
    setSortState(curr => {
      if (curr.by !== by) return { by, order: 'asc' };
      const next = getNextSortOrder(curr.order);

      return next ? { by, order: next } : { by: null, order: null };
    });
  };

  const isAnyCategorySelected = selectedCategoryIds.length > 0;

  return (
    <div className="section">
      <div className="container">
        <h1 className="title">Product Categories</h1>

        <div className="block">
          <nav className="panel">
            <p className="panel-heading">Filters</p>

            <p className="panel-tabs has-text-weight-bold">
              <a
                data-cy="FilterAllUsers"
                href="#/"
                className={classNames({ 'is-active': selectedUserId === null })}
                onClick={handleUserClick(null)}
              >
                All
              </a>

              {usersFromServer.map(u => (
                <a
                  key={u.id}
                  data-cy="FilterUser"
                  href="#/"
                  className={classNames({
                    'is-active': selectedUserId === u.id,
                  })}
                  onClick={handleUserClick(u.id)}
                >
                  {u.name}
                </a>
              ))}
            </p>

            <div className="panel-block">
              <p className="control has-icons-left has-icons-right">
                <input
                  data-cy="SearchField"
                  type="text"
                  className="input"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />

                <span className="icon is-left">
                  <i className="fas fa-search" aria-hidden="true" />
                </span>

                {searchQuery !== '' && (
                  <span className="icon is-right">
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <button
                      data-cy="ClearButton"
                      type="button"
                      className="delete"
                      onClick={handleClearSearch}
                    />
                  </span>
                )}
              </p>
            </div>

            <div className="panel-block is-flex-wrap-wrap">
              <a
                href="#/"
                data-cy="AllCategories"
                className={classNames('button', 'is-success', 'mr-6', {
                  'is-outlined': isAnyCategorySelected,
                })}
                onClick={handleClearCategories}
              >
                All
              </a>

              {categoriesFromServer.map(cat => (
                <a
                  key={cat.id}
                  data-cy="Category"
                  className={classNames('button', 'mr-2', 'my-1', {
                    'is-info': selectedCategoryIds.includes(cat.id),
                  })}
                  href="#/"
                  onClick={handleToggleCategory(cat.id)}
                >
                  {cat.title}
                </a>
              ))}
            </div>

            <div className="panel-block">
              <a
                data-cy="ResetAllButton"
                href="#/"
                className="button is-link is-outlined is-fullwidth"
                onClick={handleResetAll}
              >
                Reset all filters
              </a>
            </div>
          </nav>
        </div>

        <div className="box table-container">
          {displayedProducts.length === 0 && (
            <p data-cy="NoMatchingMessage">
              No products matching selected criteria
            </p>
          )}

          {displayedProducts.length > 0 && (
            <table
              data-cy="ProductTable"
              className="table is-striped is-narrow is-fullwidth"
            >
              <thead>
                <tr>
                  <th>
                    <span className="is-flex is-flex-wrap-nowrap">
                      ID
                      <a href="#/" onClick={handleCycleSort('id')}>
                        <span className="icon">
                          <i
                            data-cy="SortIcon"
                            className={classNames(
                              'fas',
                              getSortIcon(
                                sortState.by === 'id',
                                sortState.by === 'id' ? sortState.order : null,
                              ),
                            )}
                          />
                        </span>
                      </a>
                    </span>
                  </th>

                  <th>
                    <span className="is-flex is-flex-wrap-nowrap">
                      Product
                      <a href="#/" onClick={handleCycleSort('name')}>
                        <span className="icon">
                          <i
                            data-cy="SortIcon"
                            className={classNames(
                              'fas',
                              getSortIcon(
                                sortState.by === 'name',
                                sortState.by === 'name'
                                  ? sortState.order
                                  : null,
                              ),
                            )}
                          />
                        </span>
                      </a>
                    </span>
                  </th>

                  <th>
                    <span className="is-flex is-flex-wrap-nowrap">
                      Category
                      <a href="#/" onClick={handleCycleSort('category')}>
                        <span className="icon">
                          <i
                            data-cy="SortIcon"
                            className={classNames(
                              'fas',
                              getSortIcon(
                                sortState.by === 'category',
                                sortState.by === 'category'
                                  ? sortState.order
                                  : null,
                              ),
                            )}
                          />
                        </span>
                      </a>
                    </span>
                  </th>

                  <th>
                    <span className="is-flex is-flex-wrap-nowrap">
                      User
                      <a href="#/" onClick={handleCycleSort('user')}>
                        <span className="icon">
                          <i
                            data-cy="SortIcon"
                            className={classNames(
                              'fas',
                              getSortIcon(
                                sortState.by === 'user',
                                sortState.by === 'user'
                                  ? sortState.order
                                  : null,
                              ),
                            )}
                          />
                        </span>
                      </a>
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayedProducts.map(product => (
                  <tr key={product.id} data-cy="Product">
                    <td className="has-text-weight-bold" data-cy="ProductId">
                      {product.id}
                    </td>

                    <td data-cy="ProductName">{product.name}</td>

                    <td data-cy="ProductCategory">
                      {product.category
                        ? `${product.category.icon} - ${product.category.title}`
                        : '—'}
                    </td>

                    <td
                      data-cy="ProductUser"
                      className={classNames({
                        'has-text-link': product.user?.sex === 'm',
                        'has-text-danger': product.user?.sex === 'f',
                      })}
                    >
                      {product.user?.name ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
