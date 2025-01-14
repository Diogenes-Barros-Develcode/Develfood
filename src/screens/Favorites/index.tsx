import {useAuth} from '@global/context';
import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {RFValue} from 'react-native-responsive-fontsize';
import {useTheme} from 'styled-components';
import {useDebouncedCallback} from 'use-debounce';
import {Category} from '../../components/CategoryButton';
import {HeaderComponent} from '../../components/HeaderComponent';
import {Input} from '../../components/Input';
import {ListEmptyComponent} from '../../components/ListEmptyComponent';
import {Plates} from '../../components/Plates';
import {useFetch} from '../../global/services/get';
import {CategorySelect} from '../Home/styles';
import {PlatesWrapper} from '../RestaurantProfile/styles';
import {Container, Content, Footer} from './styles';
export interface FavoritesResponse {
  content: Plate[];
  totalPages: number;
  totalElements: number;
}

interface ListFoodType {
  id: number;
  name: string;
}
interface Plate {
  id: number;
  name: string;
  description: string;
  price: number;
  foodType: ListFoodType;
  restaurant: Restaurant;
  photo_url: string;
  favorite: boolean;
}

interface Restaurant {
  id: number;
  photo_url: string;
  food_types: ListFoodType[];
}

export function Favorites({navigation}: any) {
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(false);

  const {token} = useAuth();

  const [isFiltred, setIsFiltred] = useState({
    text: '',
    page: 0,
  });

  const [foodType, setFoodType] = useState<string>('');

  const {data: dataFavorites, fetchData} = useFetch<FavoritesResponse>(
    `plate/favoritePlates/search?page=${isFiltred.page}&quantity=10&plateName=${
      isFiltred.text
    }&${foodType !== '' ? `foodType=${foodType}&` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const [favoritePlates, setFavoritePlates] = useState<Plate[]>([]);

  function onSuccess(responseFavorites: FavoritesResponse) {
    setFavoritePlates([...favoritePlates, ...responseFavorites.content]);
  }

  async function handleLoadOnEnd() {
    if (isFiltred.page < dataFavorites.totalPages - 1) {
      setIsFiltred({...isFiltred, page: isFiltred.page + 1});
    }
  }

  async function loadFavorites() {
    setIsLoading(true);
    await fetchData(onSuccess);
    setIsLoading(false);
  }

  function handleSearch(value: string) {
    setIsLoading(true);
    if (value.length > 0) {
      setFavoritePlates([]);
      setIsFiltred({text: value, page: 0});
    } else {
      setFavoritePlates([]);
      setIsFiltred({text: '', page: 0});
    }
    setIsLoading(false);
  }

  const debounced = useDebouncedCallback(value => {
    handleSearch(value);
  }, 1500);

  const [activeButton, setActiveButton] = useState<'' | ListFoodType['name']>(
    '',
  );

  const onPress = (item: ListFoodType) => {
    activeButton === item.name
      ? setActiveButton('')
      : setActiveButton(item.name);
    setFavoritePlates([]);
    foodType === item.name ? setFoodType('') : setFoodType(item.name);
    setIsFiltred({...isFiltred, page: 0});
  };

  const [categories, setCategories] = useState<ListFoodType[]>([]);

  const {data: datafoodtype, fetchData: fetchfoodtype} = useFetch<
    ListFoodType[]
  >('/foodType', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useLayoutEffect((usefetchfoodtype = fetchfoodtype) => {
    (async () => {
      await usefetchfoodtype();
    })();
  }, []);

  useEffect(() => {
    datafoodtype && setCategories(datafoodtype);
  }, [datafoodtype]);

  useFocusEffect(
    useCallback(
      (useloadFavorites = loadFavorites) => {
        useloadFavorites();
      },
      [foodType, isFiltred],
    ),
  );

  const renderCategories =
    categories.length > 1 &&
    categories?.map(item => {
      return (
        <Category
          key={item.id}
          title={item.name}
          style={
            activeButton === item.name && {
              backgroundColor: theme.colors.background,
              borderWidth: 2,
              borderColor: theme.colors.background_red,
            }
          }
          textStyle={
            activeButton === item.name && {color: theme.colors.background_red}
          }
          onPress={() => onPress(item)}
        />
      );
    });

  const renderItem = ({item}: {item: Plate}) => {
    return (
      <PlatesWrapper>
        <Plates
          Swipe={false}
          inside={false}
          name={item.name}
          description={item.description}
          price={item.price}
          source={item.photo_url}
          id={item.id}
          favorite={item.favorite}
          restaurantID={item.restaurant.id}
          photoRestaurant={item.restaurant.photo_url}
          restaurantFoodTypes={item.restaurant.food_types[0].name}
        />
      </PlatesWrapper>
    );
  };

  function handlerBackButton() {
    navigation.navigate('Inicio');
  }

  return (
    <Container>
      <StatusBar
        barStyle={theme.barStyles.dark}
        translucent={false}
        backgroundColor={theme.colors.background}
      />

      <HeaderComponent
        backgroudColor={theme.colors.background}
        name="Favoritos"
        Textcolor={theme.colors.text_dark}
        iconColor={theme.colors.icon_gray}
        onPress={handlerBackButton}
      />

      <FlatList
        ListHeaderComponent={
          <View style={{marginBottom: RFValue(30)}}>
            <Content>
              <Input
                source={theme.icons.search}
                placeholder="Buscar favoritos"
                onChangeText={value => debounced(value)}
                sourcePassword={false}
              />
            </Content>

            <CategorySelect
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{paddingLeft: RFValue(10)}}>
              {renderCategories}
            </CategorySelect>
          </View>
        }
        data={favoritePlates}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        onEndReached={() => {
          handleLoadOnEnd();
        }}
        ListFooterComponent={() => (
          <Footer>
            {isLoading && (
              <ActivityIndicator color={theme.colors.background_red} />
            )}
          </Footer>
        )}
        ListEmptyComponent={
          !isLoading && dataFavorites.totalElements === 0 ? (
            <ListEmptyComponent
              source={theme.images.noFavorites}
              title="Você não possui favoritos"
            />
          ) : null
        }
      />
    </Container>
  );
}
