import { UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { CurrentUser, ICurrentUser } from 'src/commons/auth/gql-user.param';
import { GqlAuthRefreshGuard } from 'src/commons/auth/gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly userService: UserService, //
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => String)
  async login(
    @Args('email') email: string, //
    @Args('password') password: string,
    @Context() context: any,
  ) {
    // 1. 로그인(이메일과 비밀번호가 일치하는 유저 찾기)
    const user = await this.userService.findOne({ email });

    // 2. 일치하는 유저가 없으면?! 에러 던지기!!!
    if (!user) throw new UnprocessableEntityException('이메일이 없습니다.');

    // 3. 일치하는 유저가 있지만, 암호가 틀렸다면?! 에러 던지기!!!
    const isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth) throw new UnprocessableEntityException('암호가 틀렸습니다.');

    // 4. refreshToken(=JWT)을 만들어서 프론트엔드 (쿠키)에 보내주기
    console.log(context); // 이 안에 req , res가 들어가 있음
    this.authService.setRefreshToken({ user, res: context.res });

    // 5. 일치하는 유저가 있으면?! accessToken(=JWT)을 만들어서 프론트엔드에 주기
    return this.authService.getAccessToken({ user });
  }
  @UseGuards(GqlAuthRefreshGuard) // refresh토큰을 통과한 사람만 가능
  @Mutation(() => String)
  restoreAccessToken(
    @CurrentUser() currentUser: ICurrentUser,
    // currentuser를 쓸 수 있다는 뜻은 jwt 액세스 토큰 아이디 이메일이 리턴이 되어야 파람에 들어감
    @Context() context: any,
  ) {
    return this.authService.getAccessToken({ user: currentUser });
  }
}
